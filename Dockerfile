# Usa una imagen base de Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (si existe)
# Esto permite que Docker use el caché de capas si las dependencias no cambian
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación al directorio de trabajo
COPY . .

# Expone el puerto en el que se escuchará la aplicación Node.js (definido en server.js y .env)
EXPOSE 3000

# Define el comando para iniciar la aplicación cuando el contenedor se inicie
# Usamos "npm start" que en el package.json y ejecuta "node src/server.js"
CMD [ "npm", "start" ]