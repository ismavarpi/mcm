# Guía de despliegue

Este documento resume cómo poner en marcha la aplicación MCM tanto de forma manual en un servidor como mediante contenedores Docker.

## 1. Despliegue directo en servidor

Los pasos detallados se encuentran en `README.md`. En resumen:

1. Instalar Node.js, npm y MariaDB.
2. Crear la base de datos `mcm` y el usuario correspondiente.
3. Clonar el repositorio y ejecutar `npm install` en `server` y `client`.
4. Configurar las variables de entorno en `server/.env` siguiendo el ejemplo `server/.env.example`.
5. Lanzar la API con `npm start` y el cliente con `npm run dev` (o `npm run build` para producción).

## 2. Despliegue con Docker Desktop

A continuación se describen todos los pasos necesarios para ejecutar la aplicación utilizando contenedores. Estos pasos están pensados para usuarios sin experiencia previa en Docker.

### 2.1 Preparación

1. **Instalar Docker Desktop** desde [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
2. Abrir una terminal y clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO> mcm
   cd mcm
   ```
3. Copiar el archivo de ejemplo de variables de entorno y editarlo según tus necesidades:
   ```bash
   cp server/.env.example server/.env
   # Edita server/.env con un editor de texto para ajustar las contraseñas
   ```
4. Desplegar en la carpeta mcm-main el archivo de docker-compose.yml configurado con las credenciales de acceso a base de datos.

### 2.2 Puesta en marcha

1. Desde la carpeta que contiene `docker-compose.yml` ejecutar:
   ```bash
   docker compose up --build
   ```
   Asegúrate de situarte en la raíz del proyecto (donde está `docker-compose.yml`).
   La primera vez tardará un poco porque se descargarán las imágenes base y se compilará el cliente.
2. Cuando finalice, Docker levantará dos contenedores:
   - **db**: con MariaDB y los datos persistidos en un volumen llamado `dbdata`.
   - **app**: que contiene la API Node y los archivos estáticos del cliente React.
3. Accede a la aplicación abriendo [http://localhost:3001](http://localhost:3001) en tu navegador.

### 2.3 Comandos úteis

- Detener los contenedores:
  ```bash
  docker compose down
  ```
- Ver los registros en tiempo real:
  ```bash
  docker compose logs -f
  ```
- Actualizar la imagen tras cambios en el código:
  ```bash
  docker compose build
  docker compose up -d
  ```

Con estos pasos la aplicación queda lista para usarse tanto de forma tradicional como a través de Docker.
