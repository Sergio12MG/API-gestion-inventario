const authService = require('../services/nuevoauth.service'); // Importamos el servicio de autenticación unificado para verificar el token
// const authService = require('../services/auth.service'); // Servicio de autenticación por separado para clientes y proveedores

/**
 * Middleware para autenticar solicitudes usando JWT.
 * Verifica la presencia y validez del token en el encabezado 'Authorization'.
 * Si es válido, adjunta la información del usuario (id, rol) a `req.user`.
 */
exports.authenticateJWT = (req, res, next) => {
    // 1. Obtener el token del encabezado de la solicitud
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
    }

    // El formato esperado es "Bearer TOKEN", así que extraemos solo el TOKEN
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Formato de token inválido. Se espera "Bearer [token]".' });
    }

    try {
        // 2. Verificar el token usando el servicio de autenticación
        const decoded = authService.verifyToken(token); // Esto lanza un error si el token es inválido o expira

        // 3. Adjuntar la información decodificada (id, rol) al objeto de solicitud
        req.user = decoded; // Ahora puede accederse a req.user.id y req.user.rol en los controladores
        next(); // Continuar con el siguiente middleware o controlador
    } catch (err) {
        // Capturar errores del servicio de autenticación (token inválido/expirado)
        if (err.message.includes('Token de autenticación expirado')) {
            return res.status(401).json({ message: 'Token de autenticación expirado. Por favor, inicie sesión de nuevo.' });
        }
        return res.status(403).json({ message: 'Acceso denegado. Token inválido.' }); // 403 Forbidden para token inválido
    }
};

/**
 * Middleware para autorizar roles específicos.
 * Se debe usar DESPUÉS de `authenticateJWT`.
 * @param {Array<string>} rolesPermitidos - Un array de strings con los roles que tienen permiso ('cliente' y 'proveedor').
 */
exports.authorizeRoles = (rolesPermitidos) => {
    return (req, res, next) => {
        // Se asume que `req.user` ya fue poblado por `authenticateJWT`
        if (!req.user || !req.user.rol) {
            // Esto no debería ocurrir si authenticateJWT se ejecuta primero
            return res.status(500).json({ message: 'Error de autenticación interno: Rol de usuario no disponible.' });
        }

        // Verificar si el rol del usuario está incluido en los roles permitidos
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Acceso denegado. No tiene los permisos necesarios para esta acción.' }); // 403 Forbidden
        }

        next(); // El usuario tiene el rol permitido, continuar
    };
};
