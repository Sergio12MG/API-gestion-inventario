const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Obtener todas las categorías (accesible para clientes y proveedores autenticados)
router.get('/obtener', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), categoriaController.obtenerCategorias);

// Obtener una categoría por ID (accesible para clientes y proveedores autenticados)
router.get('/obtener/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), categoriaController.obtenerCategoriaPorId);

// Crear una categoría (solo para proveedores autenticados)
router.post('/crear', authenticateJWT, authorizeRoles(['proveedor']), categoriaController.crearCategoria);

// Actualizar una categoría (solo para proveedores autenticados)
router.put('/actualizar/:id', authenticateJWT, authorizeRoles(['proveedor']), categoriaController.actualizarCategoria);

// Eliminar una categoría (solo para proveedores autenticados)
router.delete('/eliminar/:id', authenticateJWT, authorizeRoles(['proveedor']), categoriaController.eliminarCategoria);

module.exports = router;