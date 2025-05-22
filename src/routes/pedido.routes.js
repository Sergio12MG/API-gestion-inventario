const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

// Crear un pedido (solo para clientes)
router.post('/pedidos', authenticateJWT, authorizeRoles(['cliente']), pedidoController.crearPedido);

// Obtener todos los pedidos (clientes ven los suyos, proveedores ven los suyos)
router.get('/pedidos', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), pedidoController.obtenerPedidos);

// Obtener un pedido por ID (clientes ven los suyos, proveedores ven los suyos)
router.get('/pedidos/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), pedidoController.obtenerPedidoPorId);

// Actualizar un pedido (cliente actualiza dirección, proveedor actualiza estado)
router.put('/pedidos/:id', authenticateJWT, authorizeRoles(['cliente', 'proveedor']), pedidoController.actualizarPedido);

// Eliminar un pedido (solo para clientes)
router.delete('/pedidos/:id', authenticateJWT, authorizeRoles(['cliente']), pedidoController.eliminarPedido);

module.exports = router;