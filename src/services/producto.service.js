const Producto = require('../models/producto.model'); // Modelo de Producto
const Categoria = require('../models/categoria.model'); // Modelo de Categoria para validación y asociaciones
const Proveedor = require('../models/proveedor.model'); // Modelo de Proveedor para validación de FK lógica
const DetallePedido = require('../models/detalle_pedido.model'); // Modelo de DetallePedido para validación de FK lógica
const { Op } = require('sequelize'); // Importar Op para operadores de Sequelize

// =================== SERVICIOS DE PRODUCTO ===================
// Crear un producto
exports.crearProducto = async (nombre_producto, descripcion_producto, imagen_producto, cantidad_producto, preciounitario_producto, id_categoria, id_proveedor) => {
    try {
        // 1. Validar la existencia de la Categoría (FK normal por estar en la misma DB)
        const categoriaExistente = await Categoria.findByPk(id_categoria);
        if (!categoriaExistente) {
            throw new Error('La categoría especificada no existe.');
        }

        // 2. Validar la existencia del Proveedor (FK lógica por estar en otra DB)
        // Aquí interactuamos con el modelo Proveedor de la otra DB
        const proveedorExistente = await Proveedor.findByPk(id_proveedor);
        if (!proveedorExistente) {
            throw new Error('El proveedor especificado no existe.');
        }

        // 3. Crear el nuevo producto
        const nuevoProducto = await Producto.create({
            nombre_producto: nombre_producto,
            descripcion_producto: descripcion_producto,
            imagen_producto: imagen_producto,
            cantidad_producto: cantidad_producto,
            preciounitario_producto: preciounitario_producto,
            id_categoria: id_categoria,
            id_proveedor: id_proveedor
        });

        return nuevoProducto;
    } catch (err) {
        throw new Error(`Error al crear el producto: ${err.message}`);
    }
};

// Obtener todos los productos (con filtros opcionales)
exports.obtenerProductos = async (filtros = {}) => {
    try {
        const { id_categoria, id_proveedor, nombre_producto, min_precio, max_precio } = filtros;
        const whereClause = {};

        // Filtro por ID de categoría
        if (filtros.id_categoria) {
            whereClause.id_categoria = filtros.id_categoria;
        }
        if (filtros.proveedor) {
            whereClause.id_proveedor = filtros.id_proveedor;
        }
        // Filtro por nombre de producto (búsqueda parcial insensible a mayúsculas/minúsculas)
        if (filtros.nombre_producto) {
            whereClause.nombre_producto = {
                [Op.iLike]: `%${filtros.nombre_producto}%` // Búsqueda parcial y case-insensitive
            };
        }
        if (filtros.min_precio !== undefined || max_precio !== undefined) {
            whereClause.preciounitario_producto = {};
            if (filtros.min_precio !== undefined) {
                whereClause.preciounitario_producto[Op.gte] = min_precio;
            }
            if (max_precio !== undefined) {
                whereClause.preciounitario_producto[Op.lte] = max_precio;
            }
        }

        const productos = await Producto.findAll({
            where: whereClause,
            include: [
                {
                    model: Categoria,
                    attributes: ['id_categoria', 'nombre_categoria']
                }
            ]
        });

        // Obtener los productos con datos del proveedor desde la otra DB
        const productosConProveedor = await Promise.all(productos.map(async (producto) => {
            const proveedor = await Proveedor.findByPk(producto.id_proveedor, {
                attributes: ['nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor'] // Incluye los campos necesarios del proveedor
            });
            // Convertir a JSON y añadir el proveedor para evitar problemas con inmutabilidad de Sequelize
            const productoJSON = producto.toJSON();
            return {
                ...productoJSON,
                proveedor: proveedor ? proveedor.toJSON() : null // Añade el objeto proveedor
            };
        }));

        return productosConProveedor;
    } catch (err) {
        throw new Error(`Error al obtener los productos: ${err.message}`);
    }
};

// Obtener un producto por su ID
exports.obtenerProductoPorId = async (id_producto) => {
    try {
        const producto = await Producto.findByPk(id_producto, {
            include: [
                {
                    model: Categoria,
                    attributes: ['id_categoria', 'nombre_categoria']
                }
            ]
        });

        if (!producto) {
            throw new Error('El producto no existe.');
        }

        // Si el producto existe, buscar los datos del proveedor
        const proveedor = await Proveedor.findByPk(producto.id_proveedor, {
            attributes: ['nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
        });

        const productoJSON = producto.toJSON();
        return {
            ...productoJSON,
            proveedor: proveedor ? proveedor.toJSON() : null
        };
    } catch (err) {
        throw new Error(`Error al obtener el producto: ${err.message}`);
    }
};

// Actualizar un producto por su ID
exports.actualizarProducto = async (id_producto, datosActualizados) => {
    try {
        // Para verificar la existencia del producto
        const producto = await Producto.findByPk(id_producto);
        if (!producto) {
            throw new Error('El producto no existe.');
        }

        // No permitir la actualización de id_proveedor
        if (datosActualizados.id_proveedor && datosActualizados.id_proveedor !== producto.id_proveedor) {
            throw new Error('No es posible actualizar el proveedor asociado a un producto existente.');
        }

        // Validar si se intenta actualizar la categoría (se toma id_categoría)
        if (datosActualizados.id_categoria && datosActualizados.id_categoria !== producto.id_categoria) {
            const categoriaExistente = await Categoria.findByPk(datosActualizados.id_categoria);
            if (!categoriaExistente) {
                throw new Error('La nueva categoría especificada no existe.');
            }
        }

        // Asegurarse de que id_proveedor no esté en los datos a actualizar que se envían a Sequelize.
        const { id_proveedor, ...datosParaActualizar } = datosActualizados;

        const [filasActualizadas] = await Producto.update(datosParaActualizar, { // Usar datosParaActualizar
            where: { id_producto: id_producto },
            returning: true
        });

        if (filasActualizadas === 0) {
            throw new Error('No se pudo actualizar el producto.');
        }

        // Obtener y devolver el producto actualizado con sus asociaciones
        const productoActualizado = await Producto.findByPk(id_producto, {
            include: [
                {
                    model: Categoria,
                    attributes: ['nombre_categoria']
                }
            ]
        });

        const proveedorActualizado = await Proveedor.findByPk(productoActualizado.id_proveedor, {
            attributes: ['id_proveedor', 'nombre_proveedor', 'apellido_proveedor', 'correo_proveedor', 'celular_proveedor']
        });

        const productoJSON = productoActualizado.toJSON();
        return {
            ...productoJSON,
            proveedor: proveedorActualizado ? proveedorActualizado.toJSON() : null
        };

    } catch (err) {
        throw new Error(`Error al actualizar el producto: ${err.message}`);
    }
};

// Eliminar un producto por su ID
exports.eliminarProducto = async (id_producto) => {
    try {
        // 1. Verificar si el producto está asociado a algún detalle de pedido
        const existeDetallePedido = await DetallePedido.findOne({
            where: { id_producto: id_producto }
        });

        // Si el producto está en algún detalle de pedido, no se puede eliminar
        if (existeDetallePedido) {
            throw new Error('El producto no puede eliminarse porque está asociado a uno o más pedidos.');
        }

        // 2. Si no hay detalles de pedido asociados, proceder con la eliminación
        const filasEliminadas = await Producto.destroy({
            where: { id_producto: id_producto }
        });

        if (filasEliminadas === 0) {
            throw new Error('El producto no existe o no se pudo eliminar.');
        }

        return { message: 'Producto eliminado correctamente.' };
    } catch (err) {
        throw new Error(`Error al eliminar el producto: ${err.message}`);
    }
};