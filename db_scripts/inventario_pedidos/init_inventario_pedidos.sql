-- Tabla Categoria
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(255) UNIQUE NOT NULL
);

-- Insertar valores en la tabla Categoria
insert into categoria (nombre_categoria) values ('Bebidas'), ('Carnes'), ('Lacteos'), ('Granos'), ('Electronica'), ('Muebles'), ('Deporte'), ('Aseo');

-- Tabla Estado
CREATE TABLE estado (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(255) UNIQUE NOT NULL
);

-- Insertar los estados fijos
INSERT INTO estado (nombre_estado) VALUES ('En espera') ON CONFLICT (nombre_estado) DO NOTHING;
INSERT INTO estado (nombre_estado) VALUES ('Enviado') ON CONFLICT (nombre_estado) DO NOTHING;


-- Tabla Producto
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_producto TEXT,
    imagen_producto VARCHAR(255), -- Podría ser un URL a una imagen
    cantidad_producto INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_producto >= 0),
    precioUnitario_producto DECIMAL(10, 2) NOT NULL CHECK (precioUnitario_producto >= 0),
    id_categoria INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL, -- IMPORTANTE: Este es una FK LÓGICA a la tabla Proveedor en 'usuarios_db'.
                                  -- No se puede definir como FK real a nivel de BD.
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE RESTRICT
);

-- Tabla Pedido
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    precioTotal_pedido DECIMAL(10, 2) NOT NULL CHECK (precioTotal_pedido >= 0),
    direccionEntrega_pedido TEXT NOT NULL,
    id_cliente INTEGER NOT NULL, -- IMPORTANTE: Este es una FK LÓGICA a la tabla Cliente en 'usuarios_db'.
                                -- No se puede definir como FK real a nivel de BD.
    id_proveedor INTEGER NOT NULL, -- IMPORTANTE: Este es una FK LÓGICA a la tabla Proveedor en 'usuarios_db'.
                                  -- No se puede definir como FK real a nivel de BD.
    id_estado INTEGER NOT NULL,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado) ON DELETE RESTRICT
);

-- Tabla DetallePedido
CREATE TABLE detallepedido (
    id_detalle_pedido SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario_al_momento DECIMAL(10, 2) NOT NULL CHECK (precio_unitario_al_momento >= 0), -- Precio del producto en el momento del pedido
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT
);