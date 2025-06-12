# MCM

This repository contains a simple React/Node application.

## Setup

1. Install dependencies for server and client:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Start the backend server:
   ```bash
   cd server
   npm start
   ```

   Configure database connection with environment variables `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_HOST`. The server uses MariaDB and will auto-create the table `Models` on startup.

3. Start the frontend React app:
   ```bash
   cd ../client
   npm start
   ```

The application shows a homepage with a header and menus. Use the administration menu (gear icon) to manage models (name and author). CRUD operations are provided via popups. Data is retrieved via REST API.

## Despliegue en un servidor

A continuación se muestra un ejemplo de despliegue en un servidor Linux. Se asume que el servidor cuenta con Node.js, npm y MariaDB instalados.

1. **Clonar el repositorio** en el servidor:
   ```bash
   git clone <URL_DEL_REPOSITORIO> mcm
   cd mcm
   ```

2. **Crear la base de datos** y un usuario con permisos. Desde la consola de MariaDB:
   ```sql
   CREATE DATABASE mcm;
   CREATE USER 'mcm'@'localhost' IDENTIFIED BY 'tu_clave';
   GRANT ALL PRIVILEGES ON mcm.* TO 'mcm'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Instalar dependencias y compilar el cliente**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   npm run build
   ```
   El comando `npm run build` creará una carpeta `build` con los archivos estáticos de React.

4. **Configurar las variables de entorno** necesarias para la API:
   ```bash
   export DB_NAME=mcm
   export DB_USER=mcm
   export DB_PASS=tu_clave
   export DB_HOST=localhost
   ```
   Estas variables pueden colocarse en un fichero `.env` o en el sistema de gestión de servicios que se utilice.

5. **Iniciar el servidor Node** (puerto 3001 por defecto):
   ```bash
   cd ../server
   npm start
   ```
   Para mantenerlo en segundo plano se puede emplear `pm2` u otra herramienta similar.

6. **Servir la aplicación React**. La carpeta `client/build` contiene los archivos estáticos generados. Se pueden servir de varias formas:
   - Ejecutar `npx serve -s build` desde `client` para lanzar un servidor estático sencillo.
   - O bien configurar un servidor web (Nginx o Apache) para que utilice la carpeta `build` como directorio raíz del sitio.

Con estos pasos la API quedará accesible en el puerto 3001 y el frontend en el puerto 3000 (si se usa `serve`) o en el configurado en el servidor web.

## Despliegue con contenedores

También es posible ejecutar la aplicación mediante contenedores Docker. A continuación se ofrece un ejemplo básico usando `docker compose`.

1. **Crear los siguientes archivos** en la raíz del proyecto:

   `server/Dockerfile`
   ```Dockerfile
   FROM node:20
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

   `client/Dockerfile`
   ```Dockerfile
   FROM node:20 AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   EXPOSE 80
   ```

   `docker-compose.yml`
   ```yaml
   version: '3.8'
   services:
     db:
       image: mariadb:latest
       environment:
         MARIADB_ROOT_PASSWORD: example
         MARIADB_DATABASE: mcm
       ports:
         - "3306:3306"

     server:
       build: ./server
       environment:
         DB_NAME: mcm
         DB_USER: root
         DB_PASS: example
         DB_HOST: db
       depends_on:
         - db
       ports:
         - "3001:3001"

     client:
       build: ./client
       depends_on:
         - server
       ports:
         - "3000:80"
   ```

2. **Construir y lanzar los contenedores**:
   ```bash
   docker compose up --build
   ```

   Esto descargará las imágenes necesarias, compilará el código y levantará tres contenedores: la base de datos MariaDB, el servidor de la API y el servidor web con la aplicación React.

3. **Acceder a la aplicación** en un navegador:
   - Frontend: `http://localhost:3000`
   - API REST: `http://localhost:3001`

Con Docker es sencillo detener todo el entorno con `docker compose down` o reiniciarlo de nuevo cuando se necesite.
