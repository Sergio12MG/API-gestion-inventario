const { sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');

// Modelo para la tabla Categoria en la DB de inventario y pedidos
const Categoria = sequelizeInventarioPedidos.define('Categoria', {
    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'categoria',
    timestamps: false
});

module.exports = Categoria;