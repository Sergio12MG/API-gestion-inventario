const proveedorService = require('../services/proveedor.service.js'); // Servicio de Proveedor

// ==================== CONTROLADORES PARA PROVEEDOR ====================
// Para crear proveedores (registro público)
exports.crearProveedor = async (req, res) => {
    try {
        const { nombre_proveedor, apellido_proveedor, correo_proveedor, celular_proveedor, contrasena_proveedor } = req.body;

        // Validaciones básicas de entrada
        if (!nombre_proveedor || !correo_proveedor || !contrasena_proveedor) {
            return res.status(400).json({ message: 'Nombre, correo y contraseña son campos requeridos.' });
        }

        const nuevoProveedor = await proveedorService.crearProveedor(nombre_proveedor, apellido_proveedor, correo_proveedor, celular_proveedor, contrasena_proveedor);
        res.status(201).json({ message: 'Proveedor creado con éxito.', proveedor: nuevoProveedor });
    } catch (err) {
        if (err.message.includes('Este correo ya está registrado.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message }); // Otros errores del servidor
    }
};

// Para obtener todos los proveedores (Solo accesible para clientes)
exports.obtenerProveedores = async (req, res) => {
    try {
        // En este punto, el middleware authorizeRoles ya validó que req.user.rol sea 'cliente'.
        const proveedores = await proveedorService.obtenerProveedores();
        res.status(200).json(proveedores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener un proveedor por su ID
exports.obtenerProveedorPorId = async (req, res) => {
    try {
        const { id } = req.params; // ID del proveedor solicitado en la URL
        const userId = req.user.id; // ID del usuario autenticado (del token)
        const userRole = req.user.rol; // Rol del usuario autenticado (del token)

        // Lógica de autorización:
        // Si el usuario es un 'proveedor', solo puede ver su propio perfil
        if (userRole === 'proveedor' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede ver su propio perfil.' });
        }
        // Si el usuario es un 'cliente', puede ver cualquier perfil de proveedor
        const proveedor = await proveedorService.obtenerProveedorPorId(id);
        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }
        res.status(200).json(proveedor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para actualizar un proveedor por su ID
exports.actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params; // ID del proveedor a actualizar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado
        const datosActualizados = req.body; // Datos a actualizar

        // Lógica de autorización:
        // Solo un 'proveedor' puede actualizar su propio perfil
        if (userRole === 'proveedor' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede actualizar su propio perfil.' });
        }

        // Si el rol es 'cliente', se asume que no puede actualizar proveedores,
        const proveedorActualizado = await proveedorService.actualizarProveedor(id, datosActualizados);
        res.status(200).json({ message: 'Proveedor actualizado con éxito.', proveedor: proveedorActualizado });
    } catch (err) {
        if (err.message.includes('Este correo ya está en uso por otro proveedor.') || err.message.includes('El proveedor no existe.')) {
            return res.status(400).json({ message: err.message }); // Conflict o Bad Request
        }
        res.status(500).json({ message: err.message });
    }
};

// Para eliminar un proveedor por su ID
exports.eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params; // ID del proveedor a eliminar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado

        // Lógica de autorización:
        // Solo un 'proveedor' puede eliminar su propio perfil
        if (userRole === 'proveedor' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede eliminar su propio perfil.' });
        }

        await proveedorService.eliminarProveedor(id);
        res.status(200).json({ message: 'Proveedor eliminado con éxito.' });
    } catch (err) {
        if (err.message.includes('El proveedor no existe o no se pudo eliminar.')) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

// ==================== CONTROLADORES PARA ESTADÍSTICAS ====================
// Para obtener la cantidad de productos por proveedor
exports.getCantidadProductos = async (req, res) => {
    try {
        const { id } = req.params;
        // En este punto, el middleware authorizeRoles ya validó que req.user.rol sea 'proveedor'.
        if (req.user.rol === 'proveedor' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. No tiene permiso para ver esta información.' });
        }
        const cantidad = await proveedorService.obtenerCantidadProductosPorProveedor(id);
        res.status(200).json({ cantidadProductos: cantidad });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener la cantidad de pedidos por proveedor
exports.getCantidadPedidos = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.rol === 'proveedor' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. No tiene permiso para ver esta información.' });
        }
        const cantidad = await proveedorService.obtenerCantidadPedidosPorProveedor(id);
        res.status(200).json({ cantidadPedidos: cantidad });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener las ganancias totales por proveedor
exports.getGanancias = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.rol === 'proveedor' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. No tiene permiso para ver esta información.' });
        }
        const ganancias = await proveedorService.obtenerGananciasPorProveedor(id);
        res.status(200).json({ gananciasTotales: ganancias });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
