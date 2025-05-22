const pedidoService = require('../services/pedido.service');

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
        if (!datosPedido.id_cliente || !datosPedido.id_proveedor || !datosPedido.direccionEntrega_pedido || !datosPedido.productos || datosPedido.productos.length === 0) {
            return res.status(400).json({ message: 'Cliente, proveedor, dirección de entrega y al menos un producto son requeridos para el pedido.' });
        }

        const nuevoPedido = await pedidoService.crearPedido(datosPedido);
        res.status(201).json({ message: 'Pedido creado con éxito.', pedido: nuevoPedido });
    } catch (err) {
        // Manejo de errores específicos del servicio de pedido
        if (err.message.includes('El cliente especificado no existe.') ||
            err.message.includes('El proveedor especificado no existe.') ||
            err.message.includes('El producto') && err.message.includes('no existe.') ||
            err.message.includes('cantidad solicitada excede el stock disponible.') ||
            err.message.includes('La cantidad del producto debe ser mayor que cero.')) {
            return res.status(400).json({ message: err.message }); // 400 Bad Request
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * Obtiene todos los pedidos.
 * La visibilidad depende del rol: cliente ve los suyos, proveedor ve los suyos.
 */
exports.obtenerPedidos = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.rol;

        let pedidos;
        if (userRole === 'cliente') {
            pedidos = await pedidoService.obtenerPedidosPorCliente(userId);
        } else if (userRole === 'proveedor') {
            pedidos = await pedidoService.obtenerPedidosPorProveedor(userId);
        } else {
            return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para ver pedidos.' });
        }

        res.status(200).json(pedidos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Obtiene un pedido por su ID.
 * La visibilidad depende del rol: cliente ve los suyos, proveedor ve los suyos.
 */
exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido solicitado
        const userId = req.user.id; // ID del usuario autenticado (del token)
        const userRole = req.user.rol; // Rol del usuario autenticado (del token)

        const pedido = await pedidoService.obtenerPedidoPorId(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Lógica de autorización basada en el rol y la propiedad del pedido
        if (userRole === 'cliente' && pedido.id_cliente !== userId) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede ver sus propios pedidos.' });
        }
        if (userRole === 'proveedor' && pedido.id_proveedor !== userId) {
            return res.status(403).json({ message: 'Acceso denegado. Solo puede ver pedidos asociados a su proveedor.' });
        }

        res.status(200).json(pedido);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Actualiza un pedido.
 * El cliente puede cambiar dirección. El proveedor puede cambiar estado.
 */
exports.actualizarPedido = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido a actualizar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado
        const datosActualizados = req.body; // Datos a actualizar

        const pedidoExistente = await pedidoService.obtenerPedidoPorId(id);
        if (!pedidoExistente) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        let pedidoActualizado;

        if (userRole === 'cliente') {
            // Un cliente solo puede actualizar su propio pedido
            if (pedidoExistente.id_cliente !== userId) {
                return res.status(403).json({ message: 'Acceso denegado. Solo puede actualizar sus propios pedidos.' });
            }

            // Validar qué campos puede actualizar un cliente (dirección)
            const permitidosCliente = ['direccionEntrega_pedido']; // Campos que un cliente puede actualizar
            const camposInvalidos = Object.keys(datosActualizados).filter(field => !permitidosCliente.includes(field));

            if (camposInvalidos.length > 0) {
                return res.status(400).json({ message: `Un cliente no puede actualizar los siguientes campos: ${camposInvalidos.join(', ')}.` });
            }

            pedidoActualizado = await pedidoService.actualizarPedido(id, datosActualizados);

        } else if (userRole === 'proveedor') {
            // Un proveedor solo puede actualizar pedidos asociados a él
            if (pedidoExistente.id_proveedor !== userId) {
                return res.status(403).json({ message: 'Acceso denegado. Solo puede actualizar pedidos asociados a su proveedor.' });
            }

            // Validar qué campos puede actualizar un proveedor (id_estado)
            const permitidosProveedor = ['id_estado']; // Campos que un proveedor puede actualizar
            const camposInvalidos = Object.keys(datosActualizados).filter(field => !permitidosProveedor.includes(field));

            if (camposInvalidos.length > 0) {
                return res.status(400).json({ message: `Un proveedor no puede actualizar los siguientes campos: ${camposInvalidos.join(', ')}.` });
            }

            pedidoActualizado = await pedidoService.actualizarPedido(id, datosActualizados);

        } else {
            return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para actualizar pedidos.' });
        }

        res.status(200).json({ message: 'Pedido actualizado con éxito.', pedido: pedidoActualizado });
    } catch (err) {
        if (err.message.includes('Pedido no encontrado.') || err.message.includes('No se pudo actualizar el pedido.')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('El estado especificado no existe.')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * Elimina un pedido.
 * Solo el cliente que lo creó y si el estado lo permite.
 */
exports.eliminarPedido = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido a eliminar
        const userId = req.user.id; // ID del usuario autenticado
        const userRole = req.user.rol; // Rol del usuario autenticado

        const pedidoExistente = await pedidoService.obtenerPedidoPorId(id);
        if (!pedidoExistente) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Lógica de autorización: Solo el cliente dueño puede eliminarlo
        if (userRole === 'cliente') {
            if (pedidoExistente.id_cliente !== userId) {
                return res.status(403).json({ message: 'Acceso denegado. Solo puede eliminar sus propios pedidos.' });
            }

            await pedidoService.eliminarPedido(id);
            res.status(200).json({ message: 'Pedido eliminado con éxito.' });

        } else if (userRole === 'proveedor') {
            // Los proveedores no deberían poder eliminar pedidos, solo gestionarlos
            return res.status(403).json({ message: 'Acceso denegado. Los proveedores no pueden eliminar pedidos.' });
        } else {
             return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para eliminar pedidos.' });
        }
    } catch (err) {
        if (err.message.includes('El pedido no existe o no se pudo eliminar.')) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};