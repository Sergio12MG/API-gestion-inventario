const categoriaService = require('../services/categoria.service'); // Servicio de Categoria

// ==================== CONTROLADORES PARA CATEGORIA ====================
// Para crear una categoría
exports.crearCategoria = async (req, res) => {
    try {
        const { nombre_categoria } = req.body;

        // Validaciones básicas de entrada
        if (!nombre_categoria) {
            return res.status(400).json({ message: 'El nombre de la categoría es requerido.' });
        }

        // La autorización de rol ('proveedor') se maneja en la ruta
        const nuevaCategoria = await categoriaService.crearCategoria(nombre_categoria);
        res.status(201).json({ message: 'Categoría creada con éxito.', categoria: nuevaCategoria });
    } catch (err) {
        if (err.message.includes('La categoría ya existe.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message });
    }
};

// Para obtener todas las categorías
exports.obtenerCategorias = async (req, res) => {
    try {
        // La autorización de rol (clientes y proveedores) se maneja en la ruta.
        const categorias = await categoriaService.obtenerCategorias();
        res.status(200).json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para obtener una categoría por su ID
exports.obtenerCategoriaPorId = async (req, res) => {
    try {
        const { id } = req.params; // ID de la categoría solicitada

        // La autorización de rol (clientes y proveedores) se maneja en la ruta.
        const categoria = await categoriaService.obtenerCategoriaPorId(id);
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }
        res.status(200).json(categoria);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Para actualizar una categoría por su ID
exports.actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params; // ID de la categoría a actualizar
        const { nombre_categoria } = req.body; // Nuevo nombre de la categoría

        // Validaciones básicas de entrada
        if (!nombre_categoria) {
            return res.status(400).json({ message: 'El nombre de la categoría es requerido para la actualización.' });
        }

        // La autorización de rol ('proveedor') se maneja en la ruta.
        const categoriaActualizada = await categoriaService.actualizarCategoria(id, { nombre_categoria });
        res.status(200).json({ message: 'Categoría actualizada con éxito.', categoria: categoriaActualizada });
    } catch (err) {
        if (err.message.includes('No se pudo actualizar la categoría.') || err.message.includes('La categoría no existe.')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Ya existe una categoría con este nombre.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message });
    }
};

// Para eliminar una categoría por su ID
exports.eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params; // ID de la categoría a eliminar

        // La autorización de rol ('proveedor') se maneja en la ruta.
        await categoriaService.eliminarCategoria(id);
        res.status(200).json({ message: 'Categoría eliminada con éxito.' });
    } catch (err) {
        if (err.message.includes('La categoría no existe o no se pudo eliminar.')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('La categoría no puede eliminarse porque tiene productos asociados.')) {
            return res.status(409).json({ message: err.message }); // 409 Conflict
        }
        res.status(500).json({ message: err.message });
    }
};