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

// ==================== RUTAS PARA ESTADÍSTICAS DEL DASHBOARD ====================
// Estas rutas son específicas para que un PROVEEDOR acceda a SUS PROPIAS estadísticas.
// Por lo tanto, el ID en la URL debe coincidir con el ID del proveedor autenticado.
router.get('/:id/productos/cantidad', authenticateJWT, authorizeRoles(['proveedor']), proveedorController.getCantidadProductos);
router.get('/:id/pedidos/cantidad', authenticateJWT, authorizeRoles(['proveedor']), proveedorController.getCantidadPedidos);
router.get('/:id/pedidos/ganancias', authenticateJWT, authorizeRoles(['proveedor']), proveedorController.getGanancias);

module.exports = router;