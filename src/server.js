const { sequelizeUsuarios, sequelizeInventarioPedidos } = require('./config/db');
const app = require('./app');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

dotenv.config(); // Cargar las variables de entorno

// Importar todos los modelos primero para que estén inicializados
require('./models/cliente.model');
require('./models/proveedor.model');
require('./models/categoria.model');
require('./models/estado.model');
require('./models/producto.model');
require('./models/pedido.model');
require('./models/detalle_pedido.model');

// Después de que todos los modelos están cargados, entonces se importa el archivo de asociaciones
require('./models/associations');

// ======================================================
// Configuración para servir la aplicación Vue (frontend)
// ======================================================
// 1. Servir los archivos estáticos de la aplicación Vue
const frontendPath = path.join(__dirname, '..', 'frontend-inventario-pedidos', 'dist');
app.use(express.static(frontendPath));

// 2. Para todas las demás rutas (que no son API ni archivos estáticos existentes),
// devuelve el index.html de la aplicación Vue (para el modo history del router)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ======================================================
// Configuración para iniciar el servidor de Express
// ======================================================
const PORT = process.env.PORT || 3000; // Puerto del servidor

async function startServer() {
    try {
        // Establecer conexiones a las bases de datos
        await sequelizeUsuarios.authenticate();
        console.log('Conexión a usuarios_db (Sequelize) establecida con éxito.');

        await sequelizeInventarioPedidos.authenticate();
        console.log('Conexión a inventario_pedidos_db (Sequelize) establecida con éxito.');

        // Sincronizar los modelos con la base de datos
        await sequelizeUsuarios.sync({ force: false });
        console.log('Base de datos de usuarios sincronizada.');

        await sequelizeInventarioPedidos.sync({ force: false });
        console.log('Base de datos de inventario y pedidos sincronizada.');

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        process.exit(1);
    }
}

startServer();
