const Categoria = require('../models/categoria.model'); // Modelo de Categoria
const Producto = require('../models/producto.model'); // Modelo de Producto

// =================== SERVICIOS DE CATEGORIA ===================
// Crear una categoría
exports.crearCategoria = async (nombre) => {
    try {
        const existeCategoria = await Categoria.findOne({ where: { nombre_categoria: nombre } }); // Para evitar duplicados
        if (existeCategoria) {
            throw new Error('La categoría ya existe.');
        }

        const nuevaCategoria = await Categoria.create({
            nombre_categoria: nombre
        });

        return nuevaCategoria;
    } catch (err) {
        throw new Error(`Error al crear la categoría: ${err.message}`);
    }
};

// Obtener todas la categorías
exports.obtenerCategorias = async () => {
    try {
        const categorias = await Categoria.findAll({
            attributes: ['id_categoria', 'nombre_categoria']
        });

        return categorias;
    } catch (err) {
        throw new Error(`Error al obtener las categorías: ${err.message}`);
    }
};

// Obtener una categoría por su ID
exports.obtenerCategoriaPorId = async (id_categoria) => {
    try {
        const categoria = await Categoria.findByPk(id_categoria, {
            attributes: ['id_categoria', 'nombre_categoria']
        });
        return categoria;
    } catch (err) {
        throw new Error(`Error al obtener la categoría: ${err.message}`);
    }
};

// Actualizar una categoría
exports.actualizarCategoria = async (id_categoria, datosActualizados) => {
    try {
        const categoria = await Categoria.findByPk(id_categoria);
        if (!categoria) {
            throw new Error('La categoría no existe.');
        }

        // Si se intenta cambiar el nombre, verificar que no se repita
        if (datosActualizados.nombre_categoria && datosActualizados.nombre_categoria !== categoria.nombre_categoria) {
            const existeNombre = await Categoria.findOne({ where: { nombre_categoria: datosActualizados.nombre_categoria } });
            if (existeNombre) {
                throw new Error('Ya existe una categoría con este nombre.');
            }
        }

        const [filasActualizadas] = await Categoria.update(datosActualizados, {
            where: { id_categoria: id_categoria },
            returning: true
        });

        if (filasActualizadas === 0) {
            throw new Error('No se pudo actualizar la categoría.');
        }

        const categoriaActualizada = await Categoria.findByPk(id_categoria);
        return categoriaActualizada;
    } catch (err) {
        throw new Error(`Error al actualizar la categoría: ${err.message}`);
    }
};

// Eliminar una categoría
exports.eliminarCategoria = async (id_categoria) => {
    try {
        // Verificar si la categoría tiene productos asociados
        const productosAsociados = await Producto.count({
            where: { id_categoria: id_categoria }
        });

        if (productosAsociados > 0) {
            throw new Error('La categoría no puede eliminarse porque tiene productos asociados.');
        }

        const filasEliminadas = await Categoria.destroy({
            where: { id_categoria: id_categoria }
        });

        if (filasEliminadas === 0) {
            throw new Error('La categoría no existe o no se pudo eliminar.');
        }

        return { message: 'Categoría eliminada correctamente.' };
    } catch (err) {
        throw new Error(`Error al eliminar la categoría: ${err.message}`);
    }
};