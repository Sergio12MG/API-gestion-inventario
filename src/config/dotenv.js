const dotenv = require('dotenv'); // Importar las variables del entorno

dotenv.config(); // Cargar las variables del entorno

// Exportar las variables
module.exports = {
    PORT: process.env.PORT,
    // Variables para la DB de USUARIOS
    DB_USUARIOS_NAME: process.env.DB_USUARIOS_NAME,
    DB_USUARIOS_USER: process.env.DB_USUARIOS_USER,
    DB_USUARIOS_PASSWORD: process.env.DB_USUARIOS_PASSWORD,
    DB_USUARIOS_HOST: process.env.DB_USUARIOS_HOST,
    DB_USUARIOS_PORT: process.env.DB_USUARIOS_PORT,
    // Variables para la DB de INVENTARIO Y PEDIDOS
    DB_INVENTARIO_PEDIDOS_NAME: process.env.DB_INVENTARIO_PEDIDOS_NAME,
    DB_INVENTARIO_PEDIDOS_USER: process.env.DB_INVENTARIO_PEDIDOS_USER,
    DB_INVENTARIO_PEDIDOS_PASSWORD: process.env.DB_INVENTARIO_PEDIDOS_PASSWORD,
    DB_INVENTARIO_PEDIDOS_HOST: process.env.DB_INVENTARIO_PEDIDOS_HOST,
    DB_INVENTARIO_PEDIDOS_PORT: process.env.DB_INVENTARIO_PEDIDOS_PORT,

    JWT_SECRET: process.env.JWT_SECRET
};