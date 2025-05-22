const { sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');
const Pedido = require('./pedido.model');
const Producto = require('./producto.model');

// Modelo para la tabla DetallePedido en la DB inventario y pedidos
const DetallePedido = sequelizeInventarioPedidos.define('DetallePedido', {
    id_detalle_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Clave foránea para Pedido
    id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pedido', // Nombre de la tabla a la que hace referencia
            key: 'id_pedido' // Clave primaria de la tabla referenciada
        }
    },
    // Clave foránea para Producto
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'producto', // Nombre de la tabla a la que hace referencia
            key: 'id_producto' // Clave primara de la tabla referenciada
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1 // Asegura que la cantidad sea al menos 1
        }
    },
    precio_unitario_al_momento: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    }
}, {
    tableName: 'detallepedido',
    timestamps: false
});

module.exports = DetallePedido;
