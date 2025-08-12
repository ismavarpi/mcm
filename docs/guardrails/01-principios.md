---
title: 'Principios'
description: 'Principios generales del proyecto.'
---

# Principios

- La aplicación se desarrolla con backend Node.js/Express y frontend React con Material UI, tal como se observa en el uso de componentes MUI y llamadas a `axios` en la lista de nodos【F:client/src/components/nodes/NodeList.jsx†L1-L55】
- Todas las acciones que modifican datos se envuelven con `useProcessingAction` para evitar clics repetidos y mostrar un banner de progreso cuando la operación supera un segundo【F:client/src/hooks/useProcessing.jsx†L5-L38】【F:client/src/components/nodes/NodeList.jsx†L461-L517】
- Los formularios marcan los campos obligatorios y realizan altas/ediciones mediante diálogos modales; tras confirmar una operación, el listado se recarga para reflejar los cambios【F:client/src/components/nodes/NodeList.jsx†L461-L505】
- Cada listado permite alternar entre vista de tabla y tarjetas, aplicar filtros mediante un botón de icono y exportar datos a CSV o PDF. La exportación CSV utiliza el carácter `;` como separador【F:client/src/components/nodes/NodeList.jsx†L99-L111】
- La configuración de la aplicación se centraliza en un único fichero `.env`, que define las credenciales de base de datos, puertos y parámetros de autenticación LDAP.
