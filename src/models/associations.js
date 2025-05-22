const Cliente = require('./cliente.model');
const Proveedor = require('./proveedor.model');
const Categoria = require('./categoria.model');
const Estado = require('./estado.model');
const Producto = require('./producto.model');
const Pedido = require('./pedido.model');
const DetallePedido = require('./detalle_pedido.model');

// ============================================================================
// ASOCIACIONES PARA LA DB DE INVENTARIO Y PEDIDOS (sequelizeInventarioPedidos)
// ============================================================================

// Producto - Categoria (Producto pertenece a una Categoria)
// Un producto pertenece a una categoría. Una categoría puede tener muchos productos.
Producto.belongsTo(Categoria, {
    foreignKey: 'id_categoria',
    targetKey: 'id_categoria'
});
Categoria.hasMany(Producto, {
    foreignKey: 'id_categoria'
});

// Pedido - Estado (Pedido pertenece a un Estado)
// Un pedido tiene un estado. Un estado puede estar en muchos pedidos.
Pedido.belongsTo(Estado, {
    foreignKey: 'id_estado',
    targetKey: 'id_estado'
});
Estado.hasMany(Pedido, {
    foreignKey: 'id_estado'
});

// Pedido - DetallePedido (Un Pedido tiene muchos DetallePedido)
// Un pedido puede tener muchos detalles de pedido.
Pedido.hasMany(DetallePedido, {
    foreignKey: 'id_pedido',
    as: 'detalles' // Un alias para acceder a los detalles del pedido
});
DetallePedido.belongsTo(Pedido, {
    foreignKey: 'id_pedido'
});

// DetallePedido - Producto (Un DetallePedido pertenece a un Producto)
// Un detalle de pedido se refiere a un producto.
DetallePedido.belongsTo(Producto, {
    foreignKey: 'id_producto',
    targetKey: 'id_producto'
});
Producto.hasMany(DetallePedido, {
    foreignKey: 'id_producto'
});


// =========================================================================
// ASOCIACIONES LÓGICAS ENTRE BASES DE DATOS (NO FKs a nivel de BD)
// Estas asociaciones solo se manejan a nivel de aplicación (Sequelize)
// para facilitar las consultas, pero no crean restricciones de FK en la BD.
// =========================================================================

// Pedido - Cliente (Pedido tiene un Cliente - Cliente está en usuarios_db)
// Pedido.belongsTo(Cliente, { foreignKey: 'id_cliente', targetKey: 'id_cliente', as: 'cliente' });
// Cliente.hasMany(Pedido, { foreignKey: 'id_cliente', as: 'pedidos' });

// Pedido - Proveedor (Pedido tiene un Proveedor - Proveedor está en usuarios_db)
// Pedido.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor', as: 'proveedor' });
// Proveedor.hasMany(Pedido, { foreignKey: 'id_proveedor', as: 'pedidos' });

// Producto - Proveedor (Producto tiene un Proveedor - Proveedor está en usuarios_db)
// Producto.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor', as: 'proveedor' });
// Proveedor.hasMany(Producto, { foreignKey: 'id_proveedor', as: 'productos' });

// Nota: Las asociaciones entre diferentes instancias de Sequelize (diferentes bases de datos)
// son más complejas y no se pueden definir directamente con `belongsTo`/`hasMany` de Sequelize
// en la forma tradicional porque las bases de datos no tienen conocimiento una de la otra.
// Si las líneas comentadas arriba fueron la causa del problema, entonces el enfoque de
// cargar solo los modelos de `inventario_pedidos_db` en este archivo `associations.js`
// para las FK *físicas* dentro de esa DB es lo correcto.
// Las "asociaciones lógicas" (cross-database) se manejan a nivel de servicio/controlador,
// haciendo consultas separadas o uniendo datos en la lógica de la aplicación.
// Dado que `producto.model.js` tiene `id_proveedor` sin `references`, esto confirma
// que es una FK lógica.