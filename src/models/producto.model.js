const { sequelizeInventarioPedidos } = require('../config/db');
const { DataTypes } = require('sequelize');
const Categoria = require('./categoria.model');

// Modelo para la tabla Producto en la DB de inventario y pedidos
const Producto = sequelizeInventarioPedidos.define('Producto', {
    id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_producto: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcion_producto: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    imagen_producto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    cantidad_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    preciounitario_producto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    // Clave foránea para Categoria (en la misma DB)
    id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categoria', // Nombre de la tabla a la que hace referencia
            key: 'id_categoria' // Clave primaria de la tabla referenciada
        }
    },
    // Clave foránea lógica para Proveedor (en otra DB)
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // No se define 'references' aquí porque Proveedor está en otra DB.
        // La validación de existencia se hará a nivel de aplicación.
    }
}, {
    tableName: 'producto',
    timestamps: false
});

module.exports = Producto;
