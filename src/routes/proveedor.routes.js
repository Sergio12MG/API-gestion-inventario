const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedor.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Ruta para crear un proveedor (registro): No requiere autenticación
router.post('/crear', proveedorController.crearProveedor);

// Ruta para obtener todos los proveedores: Solo accesible para clientes
router.get('/obtener', authenticateJWT, authorizeRoles(['cliente']), proveedorController.obtenerProveedores);

// Rutas para gestionar un proveedor específico por ID: Requieren autenticación.
// Un proveedor solo puede operar sobre su propio perfil. Un cliente puede ver el perfil de cualquier proveedor.
router.get('/obtener/:id', authenticateJWT, authorizeRoles(['proveedor', 'cliente']), proveedorController.obtenerProveedorPorId);
router.put('/actualizar/:id', authenticateJWT, authorizeRoles(['proveedor']), proveedorController.actualizarProveedor);
router.delete('/eliminar/:id', authenticateJWT, authorizeRoles(['proveedor']), proveedorController.eliminarProveedor);

module.exports = router;