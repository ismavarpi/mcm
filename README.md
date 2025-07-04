# Despliegue de la aplicación MCM en un servidor Linux

Esta guía explica cómo poner en marcha la aplicación desde cero en un servidor Linux. Los ejemplos asumen una distribución basada en Debian/Ubuntu y permisos de administrador.

## Pasos previos

1. **Instalar dependencias básicas**
   ```bash
   sudo apt update
   sudo apt install nodejs npm mariadb-server
   ```
2. **Obtener o actualizar el código**
   Si es la primera vez:
   ```bash
   git clone <URL_DEL_REPOSITORIO> mcm
   cd mcm
   ```
   Si el repositorio ya está clonado en el servidor, simplemente actualízalo:
   ```bash
   cd mcm
   git pull
   ```
3. **Conectar a la base de datos**
   
   
   ```sql
    mysql -h localhost -P 3306 -u root -p
   ```
3. **Preparar la base de datos**
   ```sql
   CREATE DATABASE mcm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   -- Sustituye <TU_CONTRASENA> por la contraseña que quieras utilizar
   CREATE USER 'mcm'@'localhost' IDENTIFIED BY '<TU_CONTRASENA>';
   GRANT ALL PRIVILEGES ON mcm.* TO 'mcm'@'localhost';
   FLUSH PRIVILEGES;
   ```
5. **Configurar la API**
   ```bash
   cd server
   npm install
   cat <<'ENV' > .env
   DB_NAME=mcm
   DB_USER=mcm
   # Usa la misma contraseña definida al crear el usuario en MariaDB
   DB_PASSWORD=<TU_CONTRASENA>
   DB_ROOT_PASSWORD=rootpass
   DB_HOST=localhost   # usa "db" si la base de datos se ejecuta con Docker Compose. Usa "localhost" si se despliega la bd sin contenedores
   # Puerto por defecto de MariaDB/MySQL. Cambiar si se usa otro
   DB_PORT=3306
   ENV
   cd ..
   ```

   Esta contraseña se reutiliza por Docker para crear la base de datos
   inicial, por lo que cualquier cambio debe reflejarse tanto en el script
   de creación como en este archivo.
   ```
6. **Preparar el cliente**
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
   Si la base de datos aún no está disponible, el servidor reintentará la conexión unas veces antes de abortar.
2. **Iniciar el cliente**
   En otra terminal:
   ```bash
   cd client
   npm run dev
   ```
 React abrirá un servidor de desarrollo accesible desde otras máquinas en `http://<IP_DEL_SERVIDOR>:5173` (puerto por defecto de Vite) con recarga automática.
  
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

## Importación y exportación de datos

Para utilizar estas herramientas acceda a **Administrar** desde la cabecera y seleccione la pestaña *Importación/Exportación*.

### Exportar
1. Pulse **Exportar** para generar el fichero `export.sql` con todas las entidades. Si la operación tarda más de un segundo aparecerá el aviso *Procesando...* hasta que finalice.
2. Cuando termine, el navegador iniciará la descarga del fichero automáticamente.

### Importar
1. Seleccione un archivo `.sql`. La aplicación analizará su contenido y mostrará la lista de entidades detectadas, todas marcadas por defecto.
2. Puede desmarcar las que no desee cargar y pulsar **Ejecutar importación**. Mientras se ejecuta verá el aviso *Procesando...*.
3. Al finalizar se mostrará un registro con el resultado de cada sentencia ejecutada.

El fichero exportado contiene sentencias `INSERT` que actualizan registros existentes mediante `ON DUPLICATE KEY UPDATE`.
























# Guía de despliegue en Dockers

Este documento resume cómo poner en marcha la aplicación MCM tanto de forma manual en un servidor como mediante contenedores Docker.


A continuación se describen todos los pasos necesarios para ejecutar la aplicación utilizando contenedores. Estos pasos están pensados para usuarios sin experiencia previa en Docker.

## 2.1 Preparación

1. **Instalar Docker Desktop** desde [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
2. Abrir una terminal y clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO> mcm
   cd mcm
   ```
3. Copiar el archivo de ejemplo de variables de entorno y editarlo. Es necesario
   generar dos archivos: uno en la raíz para Docker Compose (`.env`) y otro en
   `server/.env` para ejecutar la API de forma independiente. Ambos incluyen
   ahora las variables que necesita el contenedor de MariaDB (`MYSQL_*`) junto
   a las variables usadas por la aplicación (`DB_*`):
   ```bash
   cp server/.env.example .env
   cp server/.env.example server/.env
   # Establece en DB_PASSWORD la misma contraseña empleada al crear el usuario
   # mcm. Docker Compose usará estas variables automáticamente. Usa siempre el
   # nombre del servicio "db" como DB_HOST cuando ejecutes Docker Compose. Si la
   # base de datos se ejecuta fuera de Docker, establece DB_HOST=localhost
   ```
4. Asegúrate de que `docker-compose.yml` utiliza el archivo `.env` para cargar
   las credenciales compartidas por la base de datos y la aplicación.

## 2.2 Puesta en marcha

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

## URLs de acceso

- **Desarrollo con Vite**: Ejecuta `npm run dev` en la carpeta `client`. Por defecto, el frontend se servirá en `http://<IP_DEL_SERVIDOR>:5173` y proxyeará las peticiones a la API.
- **API en local**: Si ejecutas `npm start` dentro de `server`, la API estará disponible en `http://localhost:3001`.
- **Despliegue con Docker**: Tras `docker compose up --build`, tanto el frontend compilado como la API se sirven juntos en `http://localhost:3001`.

## 2.3 Comandos úteis

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

## 2.4 Comprobación de puertos

Si tras desplegar con Docker no puedes acceder a `http://localhost:3001`, comprueba que el contenedor esté
escuchando en dicho puerto:

```bash
docker compose ps
```

Deberías ver una línea similar a:

```
app  running 0.0.0.0:3001->3001/tcp
```

Si no aparece el puerto o el estado es `exited`, revisa los mensajes con:

```bash
docker compose logs app
```

También puedes verificar desde el host que el puerto 3001 está a la escucha con:

```bash
ss -ltn '( sport = :3001 )'
```

En Windows la alternativa es:

```powershell
netstat -ano | findstr :3001
```

Si el puerto no está abierto, asegúrate de que `docker-compose.yml` tenga la directiva
`"3001:3001"` en la sección `ports` del servicio `app` y vuelve a ejecutar:

```bash
docker compose up --build
```

