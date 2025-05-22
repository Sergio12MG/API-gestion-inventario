const Pedido = require('../models/pedido.model'); // Modelo de Pedido
const DetallePedido = require('../models/detalle_pedido.model'); // Modelo de DetallePedido
const Producto = require('../models/producto.model'); // Para validar stock y precio
const Cliente = require('../models/cliente.model'); // Para validar id_cliente (FK lógica)
const Proveedor = require('../models/proveedor.model'); // Para validar id_proveedor (FK lógica)
const Estado = require('../models/estado.model'); // Para incluir el estado del pedido
const { sequelizeInventarioPedidos } = require('../config/db'); // Necesario para transacciones

// =================== SERVICIOS DE PEDIDO Y DETALLEPEDIDO ===================
/**
 * Crea un nuevo pedido con sus detalles.
 * @param {object} datosPedido - Objeto con los datos del pedido (id_cliente, id_proveedor, direccionEntrega_pedido, productos).
 * @param {Array<object>} datosPedido.productos - Array de objetos { id_producto, cantidad_solicitada }.
 * @returns {object} El pedido creado con sus detalles.
 */
exports.crearPedido = async (datosPedido) => {
    // Usaremos una transacción para asegurar la atomicidad de la operación
    const t = await sequelizeInventarioPedidos.transaction();
    try {
        const { id_cliente, id_proveedor, direccionEntrega_pedido, productos } = datosPedido;

        // 1. Validar existencia de Cliente (FK lógica)
        const clienteExistente = await Cliente.findByPk(id_cliente);
        if (!clienteExistente) {
            throw new Error('El cliente especificado no existe.');
        }

        // 2. Validar existencia de Proveedor (FK lógica)
        const proveedorExistente = await Proveedor.findByPk(id_proveedor);
        if (!proveedorExistente) {
            throw new Error('El proveedor especificado no existe.');
        }

        let precioTotal_pedido = 0;
        const detallesDelPedido = []; // Para almacenar los detalles a crear

        // 3. Validar productos, stock y calcular precio total
        if (!productos || productos.length === 0) {
            throw new Error('El pedido debe contener al menos un producto.');
        }

        for (const item of productos) {
            const producto = await Producto.findByPk(item.id_producto, { transaction: t });

            if (!producto) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
            }
            if (item.cantidad_solicitada <= 0) {
                throw new Error(`La cantidad solicitada para el producto ${producto.nombre_producto} debe ser mayor que cero.`);
            }
            if (producto.cantidad_producto < item.cantidad_solicitada) {
                throw new Error(`Stock insuficiente para el producto ${producto.nombre_producto}. Stock disponible: ${producto.cantidad_producto}`);
            }

            // Calcular el subtotal para este producto
            const subtotalProducto = producto.precioUnitario_producto * item.cantidad_solicitada;
            precioTotal_pedido += subtotalProducto;

            // Añadir a los detalles del pedido
            detallesDelPedido.push({
                id_producto: item.id_producto,
                cantidad_solicitada: item.cantidad_solicitada,
                precio_unitario_historico: producto.precioUnitario_producto // Guardar el precio en el momento del pedido
            });

            // 4. Actualizar el stock del producto
            await Producto.update(
                { cantidad_producto: producto.cantidad_producto - item.cantidad_solicitada },
                { where: { id_producto: producto.id_producto }, transaction: t }
            );
        }

        // 5. Crear el pedido principal
        const nuevoPedido = await Pedido.create({
            id_cliente,
            id_proveedor,
            direccionEntrega_pedido,
            precioTotal_pedido,
            id_estado: 1 // ID para el estado de 'En espera'
        }, { transaction: t });

        // 6. Asignar el id_pedido a cada detalle y crearlos
        for (const detalle of detallesDelPedido) {
            detalle.id_pedido = nuevoPedido.id_pedido;
        }
        await DetallePedido.bulkCreate(detallesDelPedido, { transaction: t });

        // Si todo va bien, hacer un commit de la transacción (aplicar los cambios en la DB)
        await t.commit();

        // Obtener el pedido completo con detalles y asociaciones para la respuesta
        const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id_pedido, {
            include: [
                {
                    model: DetallePedido,
                    include: {
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'descripcion_producto', 'imagen_producto']
                    }
                },
                {
                    model: Estado,
                    attributes: ['nombre_estado']
                }
            ]
        });

        // Enriquecer con datos de Cliente y Proveedor de la otra DB
        const clienteInfo = await Cliente.findByPk(pedidoCompleto.id_cliente, {
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'celular_cliente']
        });
        const proveedorInfo = await Proveedor.findByPk(pedidoCompleto.id_proveedor, {
            attributes: ['id_proveedor', 'nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
        });

        const pedidoJSON = pedidoCompleto.toJSON();
        return {
            ...pedidoJSON,
            cliente: clienteInfo ? clienteInfo.toJSON() : null,
            proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
        };

    } catch (err) {
        // Si hay algún error, hacer un rollback para la transacción (revertirla)
        await t.rollback();
        throw new Error(`Error al crear el pedido: ${err.message}`);
    }
};

/**
 * Obtiene todos los pedidos, con filtros opcionales.
 * @param {object} filtros - Objeto con filtros (id_cliente, id_proveedor, id_estado).
 * @returns {Array<object>} Lista de pedidos.
 */
exports.obtenerPedidos = async (filtros = {}) => {
    try {
        const whereClause = {};
        if (filtros.id_cliente) {
            whereClause.id_cliente = filtros.id_cliente;
        }
        if (filtros.id_proveedor) {
            whereClause.id_proveedor = filtros.id_proveedor;
        }
        if (filtros.id_estado) {
            whereClause.id_estado = filtros.id_estado;
        }

        const pedidos = await Pedido.findAll({
            where: whereClause,
            include: [
                {
                    model: DetallePedido,
                    include: {
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'descripcion_producto', 'imagen_producto']
                    }
                },
                {
                    model: Estado,
                    attributes: ['nombre_estado']
                }
            ],
            order: [['fecha_pedido', 'DESC']] // Ordenar por fecha del más reciente
        });

        // Enriquecer con datos de Cliente y Proveedor de la otra DB
        const pedidosCompletos = await Promise.all(pedidos.map(async (pedido) => {
            const clienteInfo = await Cliente.findByPk(pedido.id_cliente, {
                attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'celular_cliente']
            });
            const proveedorInfo = await Proveedor.findByPk(pedido.id_proveedor, {
                attributes: ['id_proveedor', 'nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
            });

            const pedidoJSON = pedido.toJSON();
            return {
                ...pedidoJSON,
                cliente: clienteInfo ? clienteInfo.toJSON() : null,
                proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
            };
        }));

        return pedidosCompletos;
    } catch (err) {
        throw new Error(`Error al obtener los pedidos: ${err.message}`);
    }
};

/**
 * Obtiene un pedido por su ID.
 * @param {number} id_pedido - ID del pedido a buscar.
 * @returns {object} El pedido encontrado con sus detalles.
 */
exports.obtenerPedidoPorId = async (id_pedido) => {
    try {
        const pedido = await Pedido.findByPk(id_pedido, {
            include: [
                {
                    model: DetallePedido,
                    include: {
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'descripcion_producto', 'imagen_producto']
                    }
                },
                {
                    model: Estado,
                    attributes: ['nombre_estado']
                }
            ]
        });

        if (!pedido) {
            throw new Error(`El pedido con ID ${id_pedido} no existe`);
        }

        // Enriquecer con datos de Cliente y Proveedor de la otra DB
        const clienteInfo = await Cliente.findByPk(pedido.id_cliente, {
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'celular_cliente']
        });
        const proveedorInfo = await Proveedor.findByPk(pedido.id_proveedor, {
            attributes: ['id_proveedor', 'nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
        });

        const pedidoJSON = pedido.toJSON();
        return {
            ...pedidoJSON,
            cliente: clienteInfo ? clienteInfo.toJSON() : null,
            proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
        };
    } catch (err) {
        throw new Error(`Error al obtener el pedido: ${err.message}`);
    }
};

/**
 * Actualiza el estado de un pedido.
 * @param {number} id_pedido - ID del pedido a actualizar.
 * @param {object} datosActualizados - Objeto con los datos a actualizar (id_estado, direccionEntrega_pedido).
 * @returns {object} El pedido actualizado.
 */
exports.actualizarPedido = async (id_pedido, datosActualizados) => {
    try {
        const pedido = await Pedido.findByPk(id_pedido);
        if (!pedido) {
            throw new Error('El pedido no existe.');
        }

        // No permitir actualizar id_cliente ni id_proveedor una vez creado el pedido
        if (datosActualizados.id_cliente && datosActualizados.id_cliente !== pedido.id_cliente) {
            throw new Error('No es posible cambiar el cliente de un pedido existente.');
        }
        if (datosActualizados.id_proveedor && datosActualizados.id_proveedor !== pedido.id_proveedor) {
            throw new Error('No es posible cambiar el proveedor de un pedido existente.');
        }
        // No permitir actualizar precioTotal_pedido directamente
        if (datosActualizados.precioTotal_pedido) {
            throw new Error('El precio total del pedido se calcula automáticamente y no puede actualizarse directamente.');
        }

        // Validar id_estado si se intenta actualizar
        if (datosActualizados.id_estado && datosActualizados.id_estado !== pedido.id_estado) {
            const estadoExistente = await Estado.findByPk(datosActualizados.id_estado);
            if (!estadoExistente) {
                throw new Error('El estado especificado no existe.');
            }
        }

        // Eliminar campos no actualizables antes de pasar a Sequelize
        const { id_cliente, id_proveedor, precioTotal_pedido, ...camposActualizables } = datosActualizados;

        const [filasActualizadas] = await Pedido.update(camposActualizables, {
            where: { id_pedido: id_pedido },
            returning: true
        });

        if (filasActualizadas === 0) {
            throw new Error('No se pudo actualizar el pedido.');
        }

        // Obtener y devolver el pedido actualizado con sus asociaciones
        const pedidoActualizado = await Pedido.findByPk(id_pedido, {
            include: [
                {
                    model: DetallePedido,
                    include: {
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'descripcion_producto', 'imagen_producto']
                    }
                },
                {
                    model: Estado,
                    attributes: ['nombre_estado']
                }
            ]
        });

        const clienteInfo = await Cliente.findByPk(pedidoActualizado.id_cliente, {
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'celular_cliente']
        });
        const proveedorInfo = await Proveedor.findByPk(pedidoActualizado.id_proveedor, {
            attributes: ['id_proveedor', 'nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
        });

        const pedidoJSON = pedidoActualizado.toJSON();
        return {
            ...pedidoJSON,
            cliente: clienteInfo ? clienteInfo.toJSON() : null,
            proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
        };

    } catch (err) {
        throw new Error(`Error al actualizar el pedido: ${err.message}`);
    }
};

/**
 * Elimina un pedido y sus detalles asociados.
 * @param {number} id_pedido - ID del pedido a eliminar.
 * @returns {object} Mensaje de confirmación.
 */
exports.eliminarPedido = async (id_pedido) => {
    const t = await sequelizeInventarioPedidos.transaction();
    try {
        const pedido = await Pedido.findByPk(id_pedido, { transaction: t });
        if (!pedido) {
            throw new Error('El pedido no existe.');
        }

        // 1. Eliminar los detalles del pedido primero
        await DetallePedido.destroy({
            where: { id_pedido: id_pedido },
            transaction: t
        });

        // 2. Eliminar el pedido principal
        const filasEliminadas = await Pedido.destroy({
            where: { id_pedido: id_pedido },
            transaction: t
        });

        if (filasEliminadas === 0) {
            // Esto debería ser capturado por la verificación inicial de pedido existente, pero por precaución, se verifica nuevamente.
            throw new Error('No se pudo eliminar el pedido.');
        }

        await t.commit();
        return { message: 'Pedido eliminado correctamente.' };
    } catch (err) {
        await t.rollback();
        throw new Error(`Error al eliminar el pedido: ${err.message}`);
    }
};