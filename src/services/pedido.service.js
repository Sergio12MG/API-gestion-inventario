const Pedido = require('../models/pedido.model');
const DetallePedido = require('../models/detalle_pedido.model');
const Producto = require('../models/producto.model');
const Cliente = require('../models/cliente.model'); // Asumiendo que esta es la instancia del modelo de la DB de usuarios
const Proveedor = require('../models/proveedor.model'); // Asumiendo que esta es la instancia del modelo de la DB de usuarios
const Estado = require('../models/estado.model');
const { sequelizeInventarioPedidos } = require('../config/db');
const { Op } = require('sequelize'); // Para los operadores de consulta


// Función auxiliar para obtener un pedido con sus relaciones completas
async function obtenerPedidoConRelaciones(id_pedido, transaction = null) {
    const pedido = await Pedido.findByPk(id_pedido, {
        include: [
            {
                model: Estado,
                attributes: ['id_estado', 'nombre_estado']
            },
            {
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    attributes: ['id_producto', 'nombre_producto', 'preciounitario_producto', 'imagen_producto']
                }],
                attributes: ['id_detalle_pedido', 'cantidad', 'precio_unitario_al_momento']
            }
        ],
        transaction: transaction
    });

    if (!pedido) {
        return null;
    }

    // Obtener información del cliente y proveedor de la DB de usuarios
    const clienteInfo = await Cliente.findByPk(pedido.id_cliente);
    const proveedorInfo = await Proveedor.findByPk(pedido.id_proveedor);

    const pedidoJSON = pedido.toJSON();
    return {
        ...pedidoJSON,
        cliente: clienteInfo ? clienteInfo.toJSON() : null,
        proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
    };
}


// =================== SERVICIOS DE PEDIDO ===================

/**
 * Crea un nuevo pedido con sus detalles.
 * Valida productos, stock, y asigna el estado inicial "En espera".
 * Solo para clientes.
 * @param {object} datosPedido - { id_cliente, id_proveedor, direccionentrega_pedido, productos: [{ id_producto, cantidad }] }
 * @returns {object} El pedido creado con sus detalles y relaciones.
 */
exports.crearPedido = async (datosPedido) => {
    const t = await sequelizeInventarioPedidos.transaction();
    try {
        const { id_cliente, id_proveedor, direccionentrega_pedido, productos } = datosPedido;

        // 1. Validar existencia de Cliente y Proveedor (FKs lógicas)
        const [clienteExistente, proveedorExistente] = await Promise.all([
            Cliente.findByPk(id_cliente),
            Proveedor.findByPk(id_proveedor)
        ]);

        if (!clienteExistente) {
            throw new Error('El cliente especificado no existe.');
        }
        if (!proveedorExistente) {
            throw new Error('El proveedor especificado no existe.');
        }

        // 2. Obtener el ID del estado "En espera"
        const estadoEnEspera = await Estado.findOne({
            where: { nombre_estado: 'En espera' },
            transaction: t // Incluir en la transacción
        });
        if (!estadoEnEspera) {
            throw new Error('El estado "En espera" no se encontró. Asegúrese de que exista en la tabla de estados.');
        }

        let preciototal_pedido = 0;
        const detallesParaCrear = [];
        const productosActualizarStock = []; // Para acumular productos a actualizar stock

        // 3. Validar productos, stock y calcular precio total
        for (const item of productos) {
            const { id_producto, cantidad } = item;
            if (!id_producto || !cantidad || cantidad <= 0) {
                throw new Error('Cada producto en el pedido debe tener un id_producto válido y una cantidad mayor que cero.');
            }

            const producto = await Producto.findByPk(id_producto, { transaction: t });

            if (!producto) {
                throw new Error(`El producto con ID ${id_producto} no existe.`);
            }
            if (producto.id_proveedor !== id_proveedor) { // El cliente solo puede pedir productos al proveedor del pedido
                throw new Error(`El producto con ID ${id_producto} no pertenece al proveedor ${proveedorExistente.nombre_proveedor}.`);
            }
            if (producto.cantidad_producto < cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${producto.nombre_producto}. Cantidad disponible: ${producto.cantidad_producto}.`);
            }

            // Registrar la disminución de stock
            productosActualizarStock.push({
                producto: producto,
                cantidadADisminuir: cantidad
            });

            const precioUnitarioAlMomento = parseFloat(producto.preciounitario_producto);
            preciototal_pedido += precioUnitarioAlMomento * cantidad;

            detallesParaCrear.push({
                id_producto: id_producto,
                cantidad: cantidad,
                precio_unitario_al_momento: precioUnitarioAlMomento,
            });
        }

        // 4. Crear el pedido principal
        const nuevoPedido = await Pedido.create({
            id_cliente: id_cliente,
            id_proveedor: id_proveedor,
            direccionentrega_pedido: direccionentrega_pedido,
            preciototal_pedido: preciototal_pedido,
            id_estado: estadoEnEspera.id_estado // Asignar el estado "En espera"
        }, { transaction: t });

        // 5. Asignar id_pedido a los detalles y crearlos
        for (const detalle of detallesParaCrear) {
            detalle.id_pedido = nuevoPedido.id_pedido;
        }
        await DetallePedido.bulkCreate(detallesParaCrear, { transaction: t });

        // 6. Actualizar el stock de los productos
        for (const { producto, cantidadADisminuir } of productosActualizarStock) {
            await producto.update(
                { cantidad_producto: producto.cantidad_producto - cantidadADisminuir },
                { transaction: t }
            );
        }

        await t.commit(); // Confirmar la transacción

        // Retornar el pedido completo (con relaciones)
        return await obtenerPedidoConRelaciones(nuevoPedido.id_pedido);

    } catch (err) {
        await t.rollback(); // Revertir la transacción en caso de error
        throw new Error(`Error al crear el pedido: ${err.message}`);
    }
};

/**
 * Obtiene todos los pedidos, aplicando filtros por rol de usuario.
 * @param {number} userId - ID del usuario autenticado.
 * @param {string} userRole - Rol del usuario autenticado ('cliente' o 'proveedor').
 * @returns {Array<object>} Lista de pedidos con sus detalles y relaciones.
 */
exports.obtenerPedidos = async (userId, userRole) => {
    try {
        let whereCondition = {};

        if (userRole === 'cliente') {
            whereCondition.id_cliente = userId;
        } else if (userRole === 'proveedor') {
            whereCondition.id_proveedor = userId;
        } else {
            // Un rol no autorizado no debería llegar aquí si el middleware es correcto,
            // pero se incluye como precaución.
            throw new Error('Acceso denegado. Rol no autorizado para ver pedidos.');
        }

        const pedidos = await Pedido.findAll({
            where: whereCondition,
            include: [
                {
                    model: Estado,
                    attributes: ['id_estado', 'nombre_estado']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'preciounitario_producto', 'imagen_producto']
                    }],
                    attributes: ['id_detalle_pedido', 'cantidad', 'precio_unitario_al_momento']
                }
            ],
            order: [['fecha_pedido', 'DESC']]
        });

        // Para cada pedido, obtener la información del cliente y proveedor de la otra DB
        const pedidosConUsuarios = await Promise.all(pedidos.map(async (pedido) => {
            const clienteInfo = await Cliente.findByPk(pedido.id_cliente);
            const proveedorInfo = await Proveedor.findByPk(pedido.id_proveedor);

            const pedidoJSON = pedido.toJSON();
            return {
                ...pedidoJSON,
                cliente: clienteInfo ? clienteInfo.toJSON() : null,
                proveedor: proveedorInfo ? proveedorInfo.toJSON() : null
            };
        }));

        return pedidosConUsuarios;
    } catch (err) {
        throw new Error(`Error al obtener los pedidos: ${err.message}`);
    }
};

/**
 * Obtiene un pedido específico por ID, aplicando filtros por rol de usuario.
 * @param {number} id_pedido - ID del pedido a obtener.
 * @param {number} userId - ID del usuario autenticado.
 * @param {string} userRole - Rol del usuario autenticado ('cliente' o 'proveedor').
 * @returns {object} El pedido con sus detalles y relaciones.
 */
exports.obtenerPedidoPorId = async (id_pedido, userId, userRole) => {
    try {
        const pedido = await Pedido.findByPk(id_pedido, {
            include: [
                {
                    model: Estado,
                    attributes: ['id_estado', 'nombre_estado']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'preciounitario_producto', 'imagen_producto']
                    }],
                    attributes: ['id_detalle_pedido', 'cantidad', 'precio_unitario_al_momento']
                }
            ]
        });

        if (!pedido) {
            throw new Error('Pedido no encontrado.');
        }

        // Lógica de autorización: el cliente/proveedor solo ve sus propios pedidos
        if (userRole === 'cliente' && pedido.id_cliente !== userId) {
            throw new Error('Acceso denegado. Este pedido no te pertenece.');
        }
        if (userRole === 'proveedor' && pedido.id_proveedor !== userId) {
            throw new Error('Acceso denegado. Este pedido no te pertenece.');
        }

        // Obtener información del cliente y proveedor de la DB de usuarios
        const clienteInfo = await Cliente.findByPk(pedido.id_cliente);
        const proveedorInfo = await Proveedor.findByPk(pedido.id_proveedor);

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
 * Actualiza el estado de un pedido. Solo el proveedor puede realizar esta acción.
 * @param {number} id_pedido - ID del pedido a actualizar.
 * @param {number} id_proveedor_autenticado - ID del proveedor que realiza la actualización.
 * @param {number} nuevo_id_estado - El nuevo ID del estado a asignar.
 * @returns {object} El pedido actualizado con sus detalles y relaciones.
 */
exports.actualizarEstadoPedido = async (id_pedido, id_proveedor_autenticado, nuevo_id_estado) => {
    const t = await sequelizeInventarioPedidos.transaction();
    try {
        const pedido = await Pedido.findByPk(id_pedido, { transaction: t });

        if (!pedido) {
            throw new Error('Pedido no encontrado.');
        }

        // 1. Autorización: Verificar que el pedido pertenezca al proveedor autenticado
        if (pedido.id_proveedor !== id_proveedor_autenticado) {
            throw new Error('Acceso denegado. Solo puede actualizar el estado de sus propios pedidos.');
        }

        // 2. Validar que el nuevo estado sea válido y diferente al actual
        const nuevoEstado = await Estado.findByPk(nuevo_id_estado, { transaction: t });
        if (!nuevoEstado) {
            throw new Error('El ID de estado proporcionado no es válido.');
        }
        if (pedido.id_estado === nuevo_id_estado) {
            throw new Error('El pedido ya tiene este estado.');
        }

        const estadoActual = await Estado.findByPk(pedido.id_estado, { transaction: t });
        if (estadoActual.nombre_estado === 'Enviado' && nuevoEstado.nombre_estado === 'En espera') {
             throw new Error('No se puede cambiar el estado de "Enviado" a "En espera".');
        }

        // 3. Actualizar el estado del pedido
        await Pedido.update(
            { id_estado: nuevo_id_estado },
            { where: { id_pedido: id_pedido }, transaction: t }
        );

        await t.commit();

        // Devolver el pedido actualizado con todas sus relaciones
        return await obtenerPedidoConRelaciones(id_pedido);

    } catch (err) {
        await t.rollback();
        throw new Error(`Error al actualizar el estado del pedido: ${err.message}`);
    }
};

/**
 * Elimina un pedido y sus detalles asociados.
 * Solo los clientes pueden eliminar sus propios pedidos.
 * @param {number} id_pedido - ID del pedido a eliminar.
 * @param {number} id_cliente_autenticado - ID del cliente que realiza la eliminación.
 * @returns {object} Mensaje de confirmación.
 */
exports.eliminarPedido = async (id_pedido, id_cliente_autenticado) => {
    const t = await sequelizeInventarioPedidos.transaction();
    try {
        const pedido = await Pedido.findByPk(id_pedido, { transaction: t });
        if (!pedido) {
            throw new Error('El pedido no existe.');
        }

        // 1. Autorización: Verificar que el pedido pertenezca al cliente autenticado
        if (pedido.id_cliente !== id_cliente_autenticado) {
            throw new Error('Acceso denegado. Solo puede eliminar sus propios pedidos.');
        }

        // Opcional: No permitir eliminar pedidos ya enviados
        const estadoPedido = await Estado.findByPk(pedido.id_estado, { transaction: t });
        if (estadoPedido.nombre_estado === 'Enviado') {
            throw new Error('No se puede eliminar un pedido que ya ha sido enviado.');
        }


        // 2. Eliminar los detalles del pedido primero
        await DetallePedido.destroy({
            where: { id_pedido: id_pedido },
            transaction: t
        });

        // 3. Eliminar el pedido principal
        const filasEliminadas = await Pedido.destroy({
            where: { id_pedido: id_pedido },
            transaction: t
        });

        if (filasEliminadas === 0) {
            throw new Error('No se pudo eliminar el pedido.');
        }

        await t.commit();
        return { message: 'Pedido eliminado correctamente.' };

    } catch (err) {
        await t.rollback();
        throw new Error(`Error al eliminar el pedido: ${err.message}`);
    }
};

// =================== SERVICIOS DE ESTADO ===================

/**
 * Obtiene todos los estados disponibles.
 * @returns {Array<object>} Lista de estados.
 */
exports.obtenerEstados = async () => {
    try {
        const estados = await Estado.findAll();
        return estados;
    } catch (err) {
        throw new Error(`Error al obtener los estados: ${err.message}`);
    }
};

/**
 * Obtiene un estado por su ID.
 * @param {number} id_estado - ID del estado.
 * @returns {object} El estado.
 */
exports.obtenerEstadoPorId = async (id_estado) => {
    try {
        const estado = await Estado.findByPk(id_estado);
        if (!estado) {
            throw new Error('Estado no encontrado.');
        }
        return estado;
    } catch (err) {
        throw new Error(`Error al obtener el estado: ${err.message}`);
    }
};