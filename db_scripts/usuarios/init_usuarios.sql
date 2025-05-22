-- Tabla Cliente
create table cliente (
	id_cliente SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    apellido_cliente VARCHAR(255),
    correo_cliente VARCHAR(255) UNIQUE NOT NULL,
    celular_cliente VARCHAR(20),
    contrasena_cliente VARCHAR(255) NOT NULL
);

-- Tabla Proveedor
create table proveedor (
	id_proveedor SERIAL PRIMARY KEY,
    nombre_proveedor VARCHAR(255) NOT NULL,
    apellido_proveedor VARCHAR(255),
    correo_proveedor VARCHAR(255) UNIQUE NOT NULL,
    celular_proveedor VARCHAR(20),
    contrasena_proveedor VARCHAR(255) NOT NULL
);