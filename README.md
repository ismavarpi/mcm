# Despliegue de la aplicación MCM

Esta guía describe paso a paso cómo poner en marcha la aplicación en un servidor Linux desde cero. Los ejemplos asumen una distribución basada en Debian/Ubuntu y que el usuario dispone de permisos de administrador.

## 1. Instalar dependencias básicas

Instala Node.js (versión 20 o superior), npm y MariaDB. Puedes hacerlo con:

```bash
sudo apt update
sudo apt install nodejs npm mariadb-server
```

## 2. Obtener el código de la aplicación

Escoge un directorio de trabajo y clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO> mcm
cd mcm
```

## 3. Preparar la base de datos

Accede a la consola de MariaDB y crea una base de datos junto con un usuario para la aplicación:

```sql
CREATE DATABASE mcm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mcm'@'localhost' IDENTIFIED BY 'clave_segura';
GRANT ALL PRIVILEGES ON mcm.* TO 'mcm'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Configurar la API

En la carpeta `server` instala las dependencias y crea un archivo `.env` con los datos de conexión:

```bash
cd server
npm install
cat <<'ENV' > .env
DB_NAME=mcm
DB_USER=mcm
DB_PASS=clave_segura
DB_HOST=localhost
ENV
```

Inicia la API ejecutando:

```bash
npm start
```

La primera vez se generará la tabla necesaria en la base de datos.

## 5. Construir el cliente

En otra terminal prepara la parte de React. Instala dependencias y compila:

```bash
cd client
npm install
npm run build
```

La carpeta `build` resultante contiene los archivos estáticos que se servirán al usuario.

## 6. Servir el frontend

Existen varias formas de publicar la carpeta `client/build`. La más sencilla es emplear el paquete `serve`:

```bash
npx serve -s build
```

Con esto la aplicación quedará accesible en `http://<IP_DEL_SERVIDOR>:3000`. Si lo prefieres, puedes mover el contenido de `build` a un directorio gestionado por Nginx o Apache.

## 7. Mantener los procesos en segundo plano (opcional)

Para que la API y el servidor de archivos estáticos sigan activos tras cerrar sesión se recomienda utilizar `pm2` u otra herramienta similar:

```bash
sudo npm install -g pm2
pm2 start npm --name mcm-api -- start --prefix server
pm2 start npx --name mcm-web -- serve -s build --prefix client
pm2 save
```

Con estos pasos la aplicación queda desplegada y funcionando.
