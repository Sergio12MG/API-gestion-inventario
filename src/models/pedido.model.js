const { sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');
const Estado = require('./estado.model');

// Modelo para la tabla Pedido en la DB de inventario y pedidos
const Pedido = sequelizeInventarioPedidos.define('Pedido', {
    id_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_pedido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    preciototal_pedido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    direccionentrega_pedido: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Clave foránea lógica para Cliente (en otra DB)
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Clave foránea lógica para Proveedor (en otra DB)
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Clave foránea para Estado (en la misma DB)
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'estado', // Nombre de la tabla a la que hace referencia
            key: 'id_estado' // Clave primaria de la tabla referenciada
        }
    }
}, {
    tableName: 'pedido',
    timestamps: false
});

module.exports = Pedido;
