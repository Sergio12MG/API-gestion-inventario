const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Crear un pedido (solo para clientes)
router.post('/crear', authenticateJWT, authorizeRoles(['cliente']), pedidoController.crearPedido);

// Obtener todos los pedidos (clientes ven los suyos, proveedores ven los suyos)
router.get('/obtener', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), pedidoController.obtenerPedidos);

// Obtener un pedido por ID (clientes ven los suyos, proveedores ven los suyos)
router.get('/obtener/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), pedidoController.obtenerPedidoPorId);

// Actualizar un pedido (Solo proveedores pueden cambiar el estado)
// La lógica de quién puede actualizar qué campo se moverá principalmente al controlador/servicio.
router.put('/actualizar/:id', authenticateJWT, authorizeRoles(['proveedor']), pedidoController.actualizarPedido);

// Eliminar un pedido (solo para clientes)
router.delete('/eliminar/:id', authenticateJWT, authorizeRoles(['cliente']), pedidoController.eliminarPedido);

module.exports = router;