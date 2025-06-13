# Despliegue de la aplicación MCM

Esta guía explica cómo poner en marcha la aplicación desde cero en un servidor Linux. Los ejemplos asumen una distribución basada en Debian/Ubuntu y permisos de administrador.

## Pasos previos

1. **Instalar dependencias básicas**
   ```bash
   sudo apt update
   sudo apt install nodejs npm mariadb-server
   ```
2. **Obtener el código**
   ```bash
   git clone <URL_DEL_REPOSITORIO> mcm
   cd mcm
   ```
3. **Preparar la base de datos**
   ```sql
   CREATE DATABASE mcm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'mcm'@'localhost' IDENTIFIED BY 'clave_segura';
   GRANT ALL PRIVILEGES ON mcm.* TO 'mcm'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. **Configurar la API**
   ```bash
   cd server
   npm install
   cat <<'ENV' > .env
   DB_NAME=mcm
   DB_USER=mcm
   DB_PASS=clave_segura
   DB_HOST=localhost
   ENV
   cd ..
   ```
5. **Preparar el cliente**
   ```bash
   cd client
   npm install
   cd ..
   ```

## Despliegue para debug y pruebas

1. **Iniciar la API**
   ```bash
   cd server
   npm start
   ```
   La API quedará accesible en `http://localhost:3001`.
2. **Iniciar el cliente**
   En otra terminal:
   ```bash
   cd client
   npm start
   ```
   React abrirá un servidor de desarrollo en `http://localhost:3000` con recarga automática.

## Despliegue definitivo

1. **Construir el cliente**
   ```bash
   cd client
   npm run build
   cd ..
   ```
   El directorio `client/build` contendrá los archivos estáticos listos para publicar.
2. **Servir el frontend**
   La forma más sencilla es usar `serve`:
   ```bash
   npx serve -s client/build
   ```
   También puedes copiar el contenido de `client/build` a un directorio servido por Nginx o Apache.
3. **Mantener los procesos activos**
   Para producción se recomienda utilizar `pm2` u otra herramienta que mantenga la API y el frontend en segundo plano:
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name mcm-api -- start --prefix server
   pm2 start npx --name mcm-web -- serve -s client/build
   pm2 save
   ```

Con estos pasos la aplicación queda desplegada y lista para usarse.
