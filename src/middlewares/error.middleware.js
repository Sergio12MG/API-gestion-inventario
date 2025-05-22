const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Imprimir el error en la consola
    res.status(500).json({ message: 'Error interno del servidor', error: err.message }); // Enviar una respuesta de error
};

module.exports = errorHandler;