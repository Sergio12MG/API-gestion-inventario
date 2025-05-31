const Proveedor = require('../models/proveedor.model'); // Modelo de Proveedor
const bcrypt = require('bcryptjs'); // Encriptación de contraseñas

// ==================== IMPORTACIONES PARA LAS ESTADÍSTICAS ====================
const Producto = require('../models/producto.model');
const Pedido = require('../models/pedido.model');
// ====================================================================================

// =================== SERVICIOS DE PROVEEDOR ===================
// Crear un proveedor
exports.crearProveedor = async (nombre_proveedor, apellido_proveedor, correo_proveedor, celular_proveedor, contrasena) => {
    try {
        const existeProveedor = await Proveedor.findOne({ where: { correo_proveedor } }); // Para buscar un proveedor por su correo
        if (existeProveedor) {
            throw new Error('Este correo ya está registrado.');
        }

        // Encriptar la contraseña con un límite de 10 caracteres
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Crear el nuevo proveedor
        const nuevoProveedor = await Proveedor.create({
            nombre_proveedor: nombre_proveedor,
            apellido_proveedor: apellido_proveedor,
            correo_proveedor: correo_proveedor,
            celular_proveedor: celular_proveedor,
            contrasena_proveedor: contrasenaEncriptada
        });

        // Para no devolver la contraseña encriptada
        const { contrasena_proveedor, ...proveedorSinContrasena } = nuevoProveedor.toJSON();
        return proveedorSinContrasena;
    } catch (err) {
        throw new Error(`Error al crear el proveedor: ${err.message}`);
    }
};

// Obtener todos los proveedores
exports.obtenerProveedores = async () => {
    try {
        const proveedor = await Proveedor.findAll({
            attributes: { exclude: ['contrasena_proveedor'] }
        });
        return proveedor;
    } catch (err) {
        throw new Error(`Error al obtener los proveedores: ${err.message}`);
    }
};

// Obtener un proveedor por su ID
exports.obtenerProveedorPorId = async (id_proveedor) => {
    try {
        const proveedor = await Proveedor.findByPk(id_proveedor, {
            attributes: { exclude: ['contrasena_proveedor'] }
        });
        return proveedor;
    } catch (err) {
        throw new Error(`Error al obtener el proveedor: ${err.message}`);
    }
};

// Actualizar un proveedor por su ID
exports.actualizarProveedor = async (id_proveedor, datosActualizados) => {
    try {
        const proveedor = await Proveedor.findByPk(id_proveedor); // Buscar el proveedor por su ID
        if (!proveedor) {
            throw new Error('El proveedor no existe'); //
        }

        // Si se proporciona una nueva contraseña, encriptarla
        if (datosActualizados.contrasena_proveedor) {
            datosActualizados.contrasena_proveedor = await bcrypt.hash(datosActualizados.contrasena_proveedor, 10); //
        }

        // Si se intenta cambiar el correo, verificar que no exista
        if (datosActualizados.correo_proveedor && datosActualizados.correo_proveedor !== proveedor.correo_proveedor) {
            const existeCorreo = await Proveedor.findOne({ where: { correo_proveedor: datosActualizados.correo_proveedor } });
            if (existeCorreo) {
                throw new Error('Este correo ya está en uso por otro proveedor.'); //
            }
        }

        // Actualizar el proveedor con los datos proporcionados
        const [filasActualizadas] = await Proveedor.update(datosActualizados, {
            where: { id_proveedor: id_proveedor },
            returning: true // Para obtener el registro actualizado
        });

        if (filasActualizadas === 0) {
            throw new Error(`No se pudo actualizar el proveedor.`); //
        }

        const proveedorActualizado = await Proveedor.findByPk(id_proveedor, {
            attributes: { exclude: ['contrasena_proveedor'] } //
        });
        return proveedorActualizado;
    } catch (err) {
        throw new Error(`Error al actualizar el proveedor: ${err.message}`); //
    }
};

// Eliminar un proveedor por su ID
exports.eliminarProveedor = async (id_proveedor) => {
    try {
        const filasEliminadas = await Proveedor.destroy({
            where: { id_proveedor: id_proveedor }
        });

        if (filasEliminadas === 0) {
            throw new Error('El proveedor no existe o no se pudo eliminar.');
        }

        return { message: 'Proveedor eliminado correctamente.' };
    } catch (err) {
        throw new Error(`Error al eliminar el proveedor: ${err.message}`);
    }
};

// ==================== FUNCIONES PARA ESTADÍSTICAS DEL DASHBOARD ====================
// Función para obtener la cantidad de productos de un proveedor
exports.obtenerCantidadProductosPorProveedor = async (id_proveedor) => {
    try {
        // Contar la cantidad de productos asociados al proveedor
        const cantidad = await Producto.count({
            where: { id_proveedor: id_proveedor }
        });
        return cantidad;
    } catch (err) {
        throw new Error(`Error al obtener la cantidad de productos: ${err.message}`);
    }
};

// Función para obtener la cantidad de pedidos asignados a un proveedor
exports.obtenerCantidadPedidosPorProveedor = async (id_proveedor) => {
    try {
        // Contar la cantidad de pedidos asociados al proveedor
        const cantidad = await Pedido.count({
            where: { id_proveedor: id_proveedor }
        });
        return cantidad;
    } catch (err) {
        throw new Error(`Error al obtener la cantidad de pedidos: ${err.message}`);
    }
};

// Función para obtener las ganancias totales por pedidos de un proveedor
exports.obtenerGananciasPorProveedor = async (id_proveedor) => {
    try {
        // Sumatoria de las ganancias de los pedidos asociados al proveedor
        const resultado = await Pedido.sum('preciototal_pedido', {
            where: { id_proveedor: id_proveedor }
        });
        // Si no hay pedidos, sum devuelve null, por lo que se convierte a 0
        return resultado || 0;
    } catch (err) {
        throw new Error(`Error al obtener las ganancias por pedidos: ${err.message}`);
    }
};
