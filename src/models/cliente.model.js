const { sequelizeUsuarios, sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');

// Modelo para la tabla Cliente en la DB de usuarios
const Cliente = sequelizeUsuarios.define('Cliente', {
    id_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_cliente: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido_cliente: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    correo_cliente: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    celular_cliente: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contrasena_cliente: {
        type: DataTypes.STRING(60),
        allowNull: false,
    }
}, {
    tableName: 'cliente',
    timestamps: false
});

module.exports = Cliente;