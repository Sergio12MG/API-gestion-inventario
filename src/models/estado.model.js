const { sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');

// Modelo para la tabla Estado en la DB de inventario y pedidos
const Estado = sequelizeInventarioPedidos.define('Estado', {
    id_estado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_estado: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'estado',
    timestamps: false
});

module.exports = Estado;
