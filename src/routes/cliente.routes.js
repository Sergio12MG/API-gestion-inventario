const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Ruta para crear un cliente (registro): No requiere autenticación
router.post('/crear', clienteController.crearCliente);

// Ruta para obtener todos los clientes: Solo accesible para proveedores
router.get('/obtener', authenticateJWT, authorizeRoles(['proveedor']), clienteController.obtenerClientes);

// Rutas para gestionar un cliente específico por ID: Requieren autenticación.
// Un cliente solo puede operar sobre su propio perfil. Un proveedor puede ver el perfil de cualquier cliente.
router.get('/obtener/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), clienteController.obtenerClientePorId);
router.put('/actualizar/:id', authenticateJWT, authorizeRoles(['cliente']), clienteController.actualizarCliente);
router.delete('/eliminar/:id', authenticateJWT, authorizeRoles(['cliente']), clienteController.eliminarCliente);

module.exports = router;