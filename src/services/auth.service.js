const bcrypt = require('bcryptjs'); // Para comparar contraseñas
const jwt = require('jsonwebtoken'); // Para generar y verificar JWTs
const Cliente = require('../models/cliente.model'); // Modelo de Cliente
const Proveedor = require('../models/proveedor.model'); // Modelo de Proveedor
const { JWT_SECRET } = require('../config/dotenv'); // La variable de entorno JWT_SECRET

/**
 * Servicio para autenticar usuarios (clientes y proveedores) y generar JWTs.
 */

/**
 * Intenta iniciar sesión para un cliente.
 * @param {string} correo - Correo electrónico del cliente.
 * @param {string} contrasena - Contraseña del cliente.
 * @returns {object} Un objeto con el token JWT y la información del cliente (sin contraseña).
 * @throws {Error} Si las credenciales son inválidas o el cliente no existe.
 */
exports.loginCliente = async (correo, contrasena) => {
    try {
        // Buscar el cliente por su correo
        const cliente = await Cliente.findOne({ where: { correo_cliente: correo } });

        // Verificar si el cliente existe
        if (!cliente) {
            throw new Error('Credenciales inválidas. No existe un cliente con ese correo.');
        }

        // Comparar la contraseña proporcionada con la contraseña encriptada
        const esContrasenaValida = await bcrypt.compare(contrasena, cliente.contrasena_cliente);
        if (!esContrasenaValida) {
            throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
        }

        // Si las credenciales son válidas, generar un token JWT
        // Incluye el ID del cliente y un 'rol' para identificar el tipo de usuario
        const token = jwt.sign(
            { id: cliente.id_cliente, rol: 'cliente' },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        // Devolver la información del cliente (sin la contraseña) y el token
        const { contrasena_cliente, ...clienteSinContrasena } = cliente.toJSON();
        return { token, user: clienteSinContrasena };
    } catch (err) {
        throw new Error(`Error en el login del cliente: ${err.message}`);
    }
};

/**
 * Intenta iniciar sesión para un proveedor.
 * @param {string} correo - Correo electrónico del proveedor.
 * @param {string} contrasena - Contraseña del proveedor.
 * @returns {object} Un objeto con el token JWT y la información del proveedor (sin contraseña).
 * @throws {Error} Si las credenciales son inválidas o el proveedor no existe.
 */
exports.loginProveedor = async (correo, contrasena) => {
    try {
        // Buscar el proveedor por su correo
        const proveedor = await Proveedor.findOne({ where: { correo_proveedor: correo } });

        // Verificar si el proveedor existe
        if (!proveedor) {
            throw new Error('Credenciales inválidas. No existe un proveedor con ese correo.');
        }

        // Comparar la contraseña proporcionada con la contraseña encriptada
        const esContrasenaValida = await bcrypt.compare(contrasena, proveedor.contrasena_proveedor);
        if (!esContrasenaValida) {
            throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
        }

        // Si las credenciales son válidas, generar un token JWT
        // Incluye el ID del proveedor y un 'rol' para identificar el tipo de usuario
        const token = jwt.sign(
            { id: proveedor.id_proveedor, rol: 'proveedor' },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        // Devolver la información del proveedor (sin la contraseña) y el token
        const { contrasena_proveedor, ...proveedorSinContrasena } = proveedor.toJSON();
        return { token, user: proveedorSinContrasena };
    } catch (err) {
        throw new Error(`Error en el login del proveedor: ${err.message}`);
    }
};

/**
 * Verifica y decodifica un token JWT.
 * Esto es útil para los middlewares de autenticación.
 * @param {string} token - El token JWT a verificar.
 * @returns {object} El payload decodificado del token.
 * @throws {Error} Si el token es inválido o ha expirado.
 */
exports.verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new Error('Token de autenticación expirado.');
        }
        throw new Error('Token de autenticación inválido.');
    }
};