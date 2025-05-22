const { Sequelize } = require('sequelize'); // Importar Sequelize para interactuar con PostgreSQL

// Configuración para la base de datos de USUARIOS
const sequelizeUsuarios = new Sequelize(
    process.env.DB_USUARIOS_NAME,
    process.env.DB_USUARIOS_USER,
    process.env.DB_USUARIOS_PASSWORD,
    {
        host: process.env.DB_USUARIOS_HOST,
        port: process.env.DB_USUARIOS_PORT,
        dialect: 'postgres',
        logging: false, // Para mejorar el rendimiento
        timezone: '-05:00'
    }
);

// Configuración para la base de datos de INVENTARIO Y PEDIDOS
const sequelizeInventarioPedidos = new Sequelize(
    process.env.DB_INVENTARIO_PEDIDOS_NAME,
    process.env.DB_INVENTARIO_PEDIDOS_USER,
    process.env.DB_INVENTARIO_PEDIDOS_PASSWORD,
    {
        host: process.env.DB_INVENTARIO_PEDIDOS_HOST,
        port: process.env.DB_INVENTARIO_PEDIDOS_PORT,
        dialect: 'postgres',
        logging: false, // Para mejorar el rendimiento
        timezone: '-05:00'
    }
);

// Exportar ambas instancias de Sequelize
module.exports = {
    sequelizeUsuarios,
    sequelizeInventarioPedidos
};
