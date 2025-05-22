const { sequelizeUsuarios, sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');

// Modelo para la tabla Proveedor en la DB de usuarios
const Proveedor = sequelizeUsuarios.define('Proveedor', {
    id_proveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_proveedor: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido_proveedor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    correo_proveedor: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    celular_proveedor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contrasena_proveedor: {
        type: DataTypes.STRING(60),
        allowNull: false,
    }
}, {
    tableName: 'proveedor',
    timestamps: false
});

module.exports = Proveedor;