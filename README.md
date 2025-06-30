# Despliegue de la aplicación MCM

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
  React abrirá un servidor de desarrollo accesible desde otras máquinas en `http://<IP_DEL_SERVIDOR>:3000` con recarga automática.
  
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
