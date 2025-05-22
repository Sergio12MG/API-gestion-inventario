# Sistema de Gestión de Inventario

## Comandos
Listar los contenedores en ejecución: docker ps  

Para la base usuarios_db: docker exec -it usuarios_db_container psql -U postgres -d usuarios_db  

Para la base inventario_pedidos_db: docker exec -it inventario_pedidos_db_container psql -U postgres -d inventario_pedidos_db  

Para listar tablas: \dt  

Dentro de esos contenedores pueden ejecutarse las querys SQL normalmente.  

Para salir: \q


docker-compose down --volumes # Para asegurarte de que no hay contenedores antiguos o volúmenes de datos que interfieran
docker-compose up --build    # Construye las imágenes y levanta los servicios