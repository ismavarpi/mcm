---
title: 'Seguridad y privacidad'
description: 'Pautas de seguridad y privacidad.'
---

# Seguridad y privacidad

- La autenticación se realiza mediante LDAP cuando `USE_AUTH` está activa; en caso contrario, el sistema permite sesiones sin validar credenciales, por lo que en producción debe habilitarse la autenticación【F:server/routes/auth.js†L46-L59】
- Las credenciales de base de datos y de LDAP se cargan desde variables de entorno; nunca deben almacenarse en el repositorio
- Los uploads de archivos validan la categoría de documento y renombra el fichero para evitar colisiones, pero no realizan sanitización de contenido; es recomendable limitar el tamaño y tipo de archivo aceptado【F:server/routes/nodes.js†L248-L266】
- Al eliminar nodos o adjuntos se borra también el archivo asociado del sistema de archivos para evitar fugas de información【F:server/routes/nodes.js†L279-L299】
- Las peticiones que modifican datos utilizan confirmaciones en el cliente para prevenir eliminaciones accidentales y siguen el patrón de espera segura para evitar duplicar acciones【F:client/src/components/nodes/NodeList.jsx†L461-L510】
