const productoService = require('../services/producto.service'); // Servicio de Producto

// ==================== CONTROLADORES PARA PRODUCTO ====================
// Para crear un producto
exports.crearProducto = async (req, res) => {
    try {
        const datosProducto = req.body;
        const idProveedorAutenticado = req.user.id; // ID del proveedor que está logueado

        // Validación: El id_proveedor en el cuerpo debe coincidir con el del usuario autenticado
        if (datosProducto.id_proveedor !== idProveedorAutenticado) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede crear productos asociados a su cuenta de proveedor.' });
        }

        // Validaciones básicas de entrada
        if (!datosProducto.nombre_producto || !datosProducto.cantidad_producto || datosProducto.precioUnitario_producto === undefined || !datosProducto.id_categoria || !datosProducto.id_proveedor) {
            return res.status(400).json({ message: 'Nombre, cantidad, precio unitario, ID de categoría e ID de proveedor son campos requeridos.' });
        }

        const nuevoProducto = await productoService.crearProducto(datosProducto);
        res.status(201).json({ message: 'Producto creado con éxito.', producto: nuevoProducto });
    } catch (err) {
        if (err.message.includes('La categoría especificada no existe.')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes('El proveedor especificado no existe.')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

// Para obtener todos los productos
exports.obtenerProductos = async (req, res) => {
    try {
        // No se necesita lógica de autorización aquí, ya que el middleware
        // authorizeRoles(['cliente', 'proveedor']) permite a ambos ver todos los productos.
        const productos = await productoService.obtenerProductos();
        res.status(200).json(productos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener un producto por su ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto solicitado

        // No se necesita lógica de autorización aquí, ya que el middleware
        // authorizeRoles(['cliente', 'proveedor']) permite a ambos ver productos específicos.
        const producto = await productoService.obtenerProductoPorId(id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(producto);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para actualizar un producto por su ID
exports.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto a actualizar
        const idProveedorAutenticado = req.user.id; // ID del proveedor que está logueado
        const datosActualizados = req.body; // Datos a actualizar

        // Primero, obtener el producto para verificar quién es su proveedor
        const productoExistente = await productoService.obtenerProductoPorId(id);
        if (!productoExistente) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Lógica de autorización: Solo el proveedor dueño del producto puede actualizarlo
        if (productoExistente.id_proveedor !== idProveedorAutenticado) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede actualizar sus propios productos.' });
        }

        // Validaciones: Asegurarse de que no se intente cambiar el id_proveedor o id_categoria de forma incorrecta
        if (datosActualizados.id_proveedor && datosActualizados.id_proveedor !== productoExistente.id_proveedor) {
            return res.status(400).json({ message: 'No puede cambiar el proveedor de un producto existente.' });
        }
        // Si el id_categoria se actualiza, el servicio ya se encarga de validar que exista.

        const productoActualizado = await productoService.actualizarProducto(id, datosActualizados);
        res.status(200).json({ message: 'Producto actualizado con éxito.', producto: productoActualizado });
    } catch (err) {
        if (err.message.includes('No se pudo actualizar el producto.')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('La categoría especificada no existe.')) {
            return res.status(400).json({ message: err.message }); // 400 si el error es por datos inválidos
        }
        res.status(500).json({ message: err.message });
    }
};

// Para eliminar un producto por su ID
exports.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto a eliminar
        const idProveedorAutenticado = req.user.id; // ID del proveedor que está logueado

        // Primero, obtener el producto para verificar quién es su proveedor
        const productoExistente = await productoService.obtenerProductoPorId(id);
        if (!productoExistente) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Lógica de autorización: Solo el proveedor dueño del producto puede eliminarlo
        if (productoExistente.id_proveedor !== idProveedorAutenticado) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede eliminar sus propios productos.' });
        }

        await productoService.eliminarProducto(id);
        res.status(200).json({ message: 'Producto eliminado con éxito.' });
    } catch (err) {
        if (err.message.includes('El producto no existe o no se pudo eliminar.')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('El producto no puede eliminarse porque está asociado a uno o más pedidos.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message });
    }
};