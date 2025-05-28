const express = require('express'); // Importar Express
const router = express.Router(); // Crear un enrutador
const authController = require('../controllers/auth.controller'); // Importar el controlador

// Ruta de login para clientes
//router.post('/login/cliente', authController.loginCliente);

// Ruta de login para proveedores
//router.post('/login/proveedor', authController.loginProveedor);

// Ruta de login general
router.post('/login', authController.login);

module.exports = router;