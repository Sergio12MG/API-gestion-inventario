const pedidoService = require('../services/pedido.service');
const Estado = require('../models/estado.model'); // Se usa para obtener el ID de estado

// ==================== CONTROLADORES PARA PEDIDO ====================
/**
 * Crea un nuevo pedido con sus detalles.
 * Accesible solo para clientes.
 */
exports.crearPedido = async (req, res) => {
    try {
        const datosPedido = req.body;
        const idClienteAutenticado = req.user.id; // ID del cliente que está logueado

        // Validar que el id_cliente en el cuerpo coincida con el del usuario autenticado
        if (datosPedido.id_cliente !== idClienteAutenticado) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede crear pedidos a su nombre.' });
        }

        // Validaciones básicas de entrada
        if (!datosPedido.id_cliente || !datosPedido.id_proveedor || !datosPedido.direccionentrega_pedido || !datosPedido.productos || datosPedido.productos.length === 0) {
            return res.status(400).json({ message: 'Cliente, proveedor, dirección de entrega y al menos un producto son requeridos para el pedido.' });
        }

        const nuevoPedido = await pedidoService.crearPedido(datosPedido);
        res.status(201).json({ message: 'Pedido creado con éxito.', pedido: nuevoPedido });
    } catch (err) {
        // Manejo de errores específicos del servicio de pedido
        if (err.message.includes('cliente especificado no existe') ||
            err.message.includes('proveedor especificado no existe') ||
            err.message.includes('stock insuficiente') ||
            err.message.includes('producto no existe') ||
            err.message.includes('producto con ID') || // Para el error de producto no pertenece al proveedor
            err.message.includes('cantidad mayor que cero')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes('estado "En espera" no se encontró')) {
            return res.status(500).json({ message: err.message }); // Error de configuración interna
        }
        res.status(500).json({ message: err.message }); // Otros errores del servidor
    }
};

/**
 * Obtiene todos los pedidos visibles para el usuario autenticado.
 */
exports.obtenerPedidos = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.rol;

        const pedidos = await pedidoService.obtenerPedidos(userId, userRole);
        res.status(200).json(pedidos);
    } catch (err) {
        if (err.message.includes('Acceso denegado. Rol no autorizado')) {
            return res.status(403).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * Obtiene un pedido específico por ID, verificando la pertenencia al usuario.
 */
exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.rol;

        const pedido = await pedidoService.obtenerPedidoPorId(id, userId, userRole);
        res.status(200).json(pedido);
    } catch (err) {
        if (err.message.includes('Pedido no encontrado')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Acceso denegado. Este pedido no te pertenece')) {
            return res.status(403).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * Actualiza el estado de un pedido (solo proveedores).
 */
exports.actualizarPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_estado } = req.body; // Solo esperamos id_estado
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado

        // Lógica de autorización y validación de campos a nivel de controlador
        if (userRole === 'cliente') {
            return res.status(403).json({ message: 'Acceso denegado. Los clientes solo pueden crear y eliminar pedidos.' });
        }
        if (userRole === 'proveedor') {
            if (!id_estado) {
                return res.status(400).json({ message: 'El ID de estado es requerido para actualizar el pedido.' });
            }
            // Delegar al servicio la actualización del estado
            const pedidoActualizado = await pedidoService.actualizarEstadoPedido(id, userId, id_estado);
            return res.status(200).json({ message: 'Estado del pedido actualizado con éxito.', pedido: pedidoActualizado });
        }

        return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para actualizar pedidos.' });

    } catch (err) {
        if (err.message.includes('Pedido no encontrado')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Acceso denegado') || err.message.includes('Solo puede actualizar el estado de sus propios pedidos')) {
            return res.status(403).json({ message: err.message });
        }
        if (err.message.includes('ID de estado proporcionado no es válido') || err.message.includes('ya tiene este estado') || err.message.includes('No se puede cambiar el estado')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * Elimina un pedido (solo clientes).
 */
exports.eliminarPedido = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido a eliminar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado

        // Lógica de autorización: Solo el cliente dueño puede eliminarlo
        if (userRole === 'cliente') {
            await pedidoService.eliminarPedido(id, userId); // Pasa el ID del cliente para la autorización
            res.status(200).json({ message: 'Pedido eliminado con éxito.' });
        } else if (userRole === 'proveedor') {
            // Los proveedores no deberían poder eliminar pedidos, solo gestionarlos
            return res.status(403).json({ message: 'Acceso denegado. Los proveedores no pueden eliminar pedidos.' });
        } else {
             return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para eliminar pedidos.' });
        }
    } catch (err) {
        if (err.message.includes('El pedido no existe') || err.message.includes('No se pudo eliminar el pedido')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Acceso denegado. Solo puede eliminar sus propios pedidos')) {
            return res.status(403).json({ message: err.message });
        }
        if (err.message.includes('No se puede eliminar un pedido que ya ha sido enviado')) {
             return res.status(409).json({ message: err.message }); // Conflict si intenta eliminar un pedido enviado
        }
        res.status(500).json({ message: err.message });
    }
};