const { sequelizeUsuarios, sequelizeInventarioPedidos } = require('./config/db');
const app = require('./app');
const dotenv = require('dotenv');

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

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelizeUsuarios.authenticate();
        console.log('Conexión a usuarios_db (Sequelize) establecida con éxito.');

        await sequelizeInventarioPedidos.authenticate();
        console.log('Conexión a inventario_pedidos_db (Sequelize) establecida con éxito.');

        // Opcional: Sincronizar las bases de datos (uso con precaución en producción)
        // Solo si necesitas que Sequelize cree/actualice las tablas.
        // Dado que usas scripts SQL, esto es menos necesario o se usa con { force: false }
        await sequelizeUsuarios.sync({ force: false });
        console.log('Base de datos de usuarios sincronizada (si aplica).');

        await sequelizeInventarioPedidos.sync({ force: false });
        console.log('Base de datos de inventario y pedidos sincronizada (si aplica).');


        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        process.exit(1);
    }
}

startServer();
