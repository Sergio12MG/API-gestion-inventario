/* 
const authService = require('../services/auth.service'); // Importación del servicio de autenticación

// Controlador para el inicio de sesión de un Cliente
exports.loginCliente = async (req, res) => {
    const { correo, contrasena } = req.body; // Obtener los datos del cuerpo de la solicitud

    try {
        const { token, user } = await authService.loginCliente(correo, contrasena); // Llamar al servicio de autenticación
        res.status(200).json({ message: 'Inicio de sesión exitoso.', token, user }); // Enviar el token y el usuario en la respuesta con el estado HTTP 200
    } catch (err) {
        // Mejorar el código de estado para errores de credenciales inválidas
        if (err.message.includes('Credenciales inválidas')) {
            res.status(401).json({ message: err.message }); // 401 Unauthorized para credenciales incorrectas
        } else {
            res.status(500).json({ message: err.message }); // 500 Internal Server Error para otros errores
        }
    }
};

// Controlador para el inicio de sesión de un Proveedor
exports.loginProveedor = async (req, res) => {
    const { correo, contrasena } = req.body; // Obtener los datos del cuerpo de la solicitud

    try {
        const { token, user } = await authService.loginProveedor(correo, contrasena); // Llamar al servicio de autenticación
        res.status(200).json({ message: 'Inicio de sesión exitoso.', token, user }); // Enviar el token y el usuario en la respuesta con el estado HTTP 200
    } catch (err) {
        // Mejorar el código de estado para errores de credenciales inválidas
        if (err.message.includes('Credenciales inválidas')) {
            res.status(401).json({ message: err.message }); // 401 Unauthorized para credenciales incorrectas
        } else {
            res.status(500).json({ message: err.message }); // 500 Internal Server Error para otros errores
        }
    }
};

*/

// ====================================================================================================
const authService = require('../services/nuevoauth.service');

// Controlador para el inicio de sesión unificado
exports.login = async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const { token, user } = await authService.loginUser(correo, contrasena); // <-- Cambio aquí

        res.status(200).json({ message: 'Inicio de sesión exitoso.', token, user });

    } catch (err) {
        if (err.message.includes('Credenciales inválidas')) {
            res.status(401).json({ message: err.message });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
};
