const clienteService = require('../services/cliente.service'); // Servicio de Cliente

// ==================== CONTROLADORES PARA CLIENTE ====================
// Para crear clientes (registro público)
exports.crearCliente = async (req, res) => {
    try {
        const { nombre_cliente, apellido_cliente, correo_cliente, celular_cliente, contrasena_cliente } = req.body;

        // Validaciones básicas de entrada
        if (!nombre_cliente || !correo_cliente || !contrasena_cliente) {
            return res.status(400).json({ message: 'Nombre, correo y contraseña son campos requeridos.' });
        }

        const nuevoCliente = await clienteService.crearCliente(nombre_cliente, apellido_cliente, correo_cliente, celular_cliente, contrasena_cliente);
        res.status(201).json({ message: 'Cliente creado con éxito.', cliente: nuevoCliente });
    } catch (err) {
        if (err.message.includes('Este correo ya está registrado.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message }); // Otros errores del servidor
    }
};

// Para obtener todos los clientes (Solo accesible para proveedores)
exports.obtenerClientes = async (req, res) => {
    try {
        // En este punto, el middleware authorizeRoles ya validó que req.user.rol sea 'proveedor'.
        const clientes = await clienteService.obtenerClientes();
        res.status(200).json(clientes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener un cliente por su ID
exports.obtenerClientePorId = async (req, res) => {
    try {
        const { id } = req.params; // ID del cliente solicitado en la URL
        const userId = req.user.id; // ID del usuario autenticado (del token)
        const userRole = req.user.rol; // Rol del usuario autenticado (del token)

        // Lógica de autorización:
        // Si el usuario es un 'cliente', solo puede ver su propio perfil
        if (userRole === 'cliente' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede ver su propio perfil.' });
        }
        // Si el usuario es un 'proveedor', puede ver cualquier perfil de cliente
        const cliente = await clienteService.obtenerClientePorId(id);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        res.status(200).json(cliente);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para actualizar un cliente por su ID
exports.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params; // ID del cliente a actualizar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado
        const datosActualizados = req.body; // Datos a actualizar

        // Lógica de autorización:
        // Solo un 'cliente' puede actualizar su propio perfil
        if (userRole === 'cliente' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede actualizar su propio perfil.' });
        }

        // Si el rol es 'proveedor', se asume que no puede actualizar clientes,
        const clienteActualizado = await clienteService.actualizarCliente(id, datosActualizados);
        res.status(200).json({ message: 'Cliente actualizado con éxito.', cliente: clienteActualizado });
    } catch (err) {
        if (err.message.includes('Este correo ya está en uso por otro cliente.') || err.message.includes('El cliente no existe.')) {
            return res.status(400).json({ message: err.message }); // Conflict o Bad Request
        }
        res.status(500).json({ message: err.message });
    }
};

// Para eliminar un cliente por su ID
exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params; // ID del cliente a eliminar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado

        // Lógica de autorización:
        // Solo un 'cliente' puede eliminar su propio perfil
        if (userRole === 'cliente' && userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede eliminar su propio perfil.' });
        }

        await clienteService.eliminarCliente(id);
        res.status(200).json({ message: 'Cliente eliminado con éxito.' });
    } catch (err) {
        if (err.message.includes('El cliente no existe o no se pudo eliminar.')) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};
