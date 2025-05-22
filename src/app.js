const express = require('express'); // Importar Express
const cors = require('cors'); // Importar CORS
const app = express(); // Crear una instancia de Express

app.use(express.json()); // Habilitar el uso de JSON en las solicitudes
app.use(cors()); // Habilitar CORS

// Importar rutas
const authRoutes = require('./routes/auth.routes'); // Para login/registro de usuarios/proveedores
const clienteRoutes = require('./routes/cliente.routes'); // CRUD para clientes
const proveedorRoutes = require('./routes/proveedor.routes'); // CRUD para proveedores
const categoriaRoutes = require('./routes/categoria.routes'); // CRUD para categorías
const productoRoutes = require('./routes/producto.routes'); // CRUD para productos
const pedidoRoutes = require('./routes/pedido.routes'); // CRUD para pedidos

// Definir rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/proveedores', proveedorRoutes);
app.use('/api/v1/categorias', categoriaRoutes);
app.use('/api/v1/productos', productoRoutes);
app.use('/api/v1/pedidos', pedidoRoutes);

module.exports = app;
