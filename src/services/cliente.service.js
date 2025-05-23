const Cliente = require('../models/cliente.model'); // Modelo de Cliente
const bcrypt = require('bcryptjs'); // Encriptación de contraseñas

// =================== SERVICIOS DE CLIENTE ===================
// Crear un cliente
exports.crearCliente = async (nombre_cliente, apellido_cliente, correo_cliente, celular_cliente, contrasena) => {
    try {
        const existeCliente = await Cliente.findOne({ where: { correo_cliente } }); // Para buscar un cliente por su correo
        if (existeCliente) {
            throw new Error('Este correo ya está registrado.');
        }

        // Encriptar la contraseña con un límite de 10 caracteres
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Crear el nuevo cliente
        const nuevoCliente = await Cliente.create({
            nombre_cliente: nombre_cliente,
            apellido_cliente: apellido_cliente,
            correo_cliente: correo_cliente,
            celular_cliente: celular_cliente,
            contrasena_cliente: contrasenaEncriptada
        });

        // Para no devolver la contraseña encriptada
        const { contrasena_cliente, ...clienteSinContrasena } = nuevoCliente.toJSON();
        return clienteSinContrasena;
    } catch (err) {
        throw new Error(`Error al crear el cliente: ${err.message}`);
    }
};

// Obtener todos los clientes
exports.obtenerClientes = async () => {
    try {
        const clientes = await Cliente.findAll({
            attributes: { exclude: ['contrasena_cliente'] }
        });
        return clientes;
    } catch (err) {
        throw new Error(`Error al obtener los clientes: ${err.message}`);
    }
};

// Obtener un cliente por su ID
exports.obtenerClientePorId = async (id_cliente) => {
    try {
        const cliente = await Cliente.findByPk(id_cliente, {
            attributes: { exclude: ['contrasena_cliente'] }
        });
        return cliente;
    } catch (err) {
        throw new Error(`Error al obtener el cliente: ${err.message}`);
    }
};

// Actualizar un cliente por su ID
exports.actualizarCliente = async (id_cliente, datosActualizados) => {
    try {
        const cliente = await Cliente.findByPk(id_cliente); // Buscar el cliente por su ID
        if (!cliente) {
            throw new Error('El cliente no existe');
        }

        // Si se proporciona una nueva contraseña, encriptarla
        if (datosActualizados.contrasena_cliente) {
            datosActualizados.contrasena_cliente = await bcrypt.hash(datosActualizados.contrasena_cliente, 10);
        }

        // Si se intenta cambiar el correo, verificar que no exista
        if (datosActualizados.correo_cliente && datosActualizados.correo_cliente !== cliente.correo_cliente) {
            const existeCorreo = await Cliente.findOne({ where: { correo_cliente: datosActualizados.correo_cliente } });
            if (existeCorreo) {
                throw new Error('Este correo ya está en uso por otro cliente.');
            }
        }

        // Actualizar el cliente con los datos proporcionados
        const [filasActualizadas] = await Cliente.update(datosActualizados, {
            where: { id_cliente: id_cliente },
            returning: true, // Para obtener el registro actualizado
        });

        if (filasActualizadas === 0) {
            throw new Error(`No se pudo actualizar el cliente.`);
        }

        const clienteActualizado = await Cliente.findByPk(id_cliente, {
            attributes: { exclude: ['contrasena_cliente'] }
        });
        return clienteActualizado;
    } catch (err) {
        throw new Error(`Error al actualizar el cliente: ${err.message}`);
    }
};

// Eliminar un cliente por su ID
exports.eliminarCliente = async (id_cliente) => {
    try {
        const filasEliminadas = await Cliente.destroy({
            where: { id_cliente: id_cliente }
        });

        if (filasEliminadas === 0) {
            throw new Error('El cliente no existe o no se pudo eliminar.');
        }

        return { message: 'Cliente eliminado correctamente.' };
    } catch (err) {
        throw new Error(`Error al eliminar el cliente: ${err.message}`);
    }
};
