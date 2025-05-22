const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Obtener todos los productos (accesible para clientes y proveedores autenticados)
router.get('/productos', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), productoController.obtenerProductos);

// Obtener un producto por ID (accesible para clientes y proveedores autenticados)
router.get('/productos/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), productoController.obtenerProductoPorId);

// Crear un producto (solo para proveedores autenticados)
router.post('/productos', authenticateJWT, authorizeRoles(['proveedor']), productoController.crearProducto);

// Actualizar un producto (solo para el proveedor dueño del producto)
router.put('/productos/:id', authenticateJWT, authorizeRoles(['proveedor']), productoController.actualizarProducto);

// Eliminar un producto (solo para el proveedor dueño del producto)
router.delete('/productos/:id', authenticateJWT, authorizeRoles(['proveedor']), productoController.eliminarProducto);

module.exports = router;