const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Cliente = require('../models/cliente.model');
const Proveedor = require('../models/proveedor.model');
const { JWT_SECRET } = require('../config/dotenv');

// ================================== SERVICIO DE AUTENTICACIÓN UNIFICADO ==================================

/**
 * Genera un token JWT.
 * @param {number} id - ID del usuario.
 * @param {string} rol - Rol del usuario ('cliente' o 'proveedor').
 * @returns {string} El token JWT generado.
 */
exports.generateToken = (id, rol) => {
    return jwt.sign(
        { id: id, rol: rol },
        JWT_SECRET,
        { expiresIn: '1h' } // El token expirará en 1 hora
    );
};

/**
 * Intenta iniciar sesión para un usuario (cliente o proveedor).
 * @param {string} correo - Correo electrónico del usuario.
 * @param {string} contrasena - Contraseña del usuario.
 * @returns {object} Un objeto con el token JWT y la información del usuario (sin contraseña) y su rol.
 * @throws {Error} Si las credenciales son inválidas.
 */
exports.loginUser = async (correo, contrasena) => {
    // Intenta encontrar el usuario como cliente
    let user = await Cliente.findOne({ where: { correo_cliente: correo } });
    let rol = 'cliente';

    // Si no es cliente, intenta encontrarlo como proveedor
    if (!user) {
        user = await Proveedor.findOne({ where: { correo_proveedor: correo } });
        rol = 'proveedor';
    }

    // SI EL USUARIO NO FUE ENCONTRADO EN NINGUNA DE LAS TABLAS
    if (!user) {
        throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    // Ahora que sabemos que 'user' no es null, procedemos a comparar la contraseña
    let isPasswordValid = false;
    if (rol === 'cliente') {
        isPasswordValid = await bcrypt.compare(contrasena, user.contrasena_cliente);
    } else { // rol === 'proveedor'
        isPasswordValid = await bcrypt.compare(contrasena, user.contrasena_proveedor);
    }

    if (!isPasswordValid) {
        throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    // Generar el token
    // Se usa el ID correcto (id_cliente o id_proveedor)
    const userId = (rol === 'cliente') ? user.id_cliente : user.id_proveedor;
    const token = exports.generateToken(userId, rol);

    // Devolver la información del usuario sin la contraseña
    const userJson = user.toJSON();
    if (rol === 'cliente') {
        delete userJson.contrasena_cliente;
    } else {
        delete userJson.contrasena_proveedor;
    }

    return { token, user: { ...userJson, rol: rol } };
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
            throw new Error('Token de autenticación expirado. Por favor, inicia sesión de nuevo.');
        } else if (err.name === 'JsonWebTokenError') {
            throw new Error('Token de autenticación inválido.');
        } else {
            throw new Error(`Error al verificar el token: ${err.message}`);
        }
    }
};