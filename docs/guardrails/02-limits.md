---
title: 'Límites'
description: 'Restricciones y límites del sistema.'
---

# Límites

- Los listados cargan todos los registros en memoria y filtran en el cliente; para conjuntos de datos muy grandes es necesario introducir paginación o filtros en servidor para evitar problemas de rendimiento【F:client/src/components/nodes/NodeList.jsx†L459-L517】
- Las exportaciones a CSV y PDF se generan íntegramente en el navegador, por lo que no se recomienda usarlas con volúmenes masivos de datos【F:client/src/components/nodes/NodeList.jsx†L99-L119】
- Los adjuntos se almacenan en el sistema de archivos bajo `server/uploads`; no existe versionado ni control antivirus, por lo que se debe limitar el tamaño y origen de los archivos【F:server/routes/nodes.js†L248-L266】
- La autenticación LDAP es opcional y se controla mediante la variable de entorno `USE_AUTH`; en entornos productivos debe activarse para proteger los endpoints【F:server/routes/auth.js†L46-L59】
