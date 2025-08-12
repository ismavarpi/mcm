---
title: 'Estilo de código'
description: 'Guía de estilo de código.'
---

# Estilo de código

- Usar sangría de dos espacios, comillas simples y punto y coma al final de cada instrucción en el código JavaScript y JSX, tal como se aprecia en los componentes y rutas existentes【F:client/src/components/nodes/NodeList.jsx†L1-L111】【F:server/routes/auth.js†L1-L59】
- Preferir funciones flecha y `async/await` para el manejo de asincronía, evitando callbacks anidados
- Los componentes React deben ser funcionales y declarar su estado mediante hooks; extraer lógica reutilizable a hooks como `useProcessingAction`【F:client/src/hooks/useProcessingAction.js†L1-L20】
- Nombrar variables y funciones en `camelCase`, componentes en `PascalCase` y ficheros con nombres descriptivos
- Todas las acciones que mutan datos deben invocar `useProcessingAction` para deshabilitar botones durante la operación y mostrar el banner de “Procesando…” cuando corresponda【F:client/src/hooks/useProcessing.jsx†L5-L38】【F:client/src/components/nodes/NodeList.jsx†L461-L517】
- Las exportaciones CSV utilizan `;` como separador; cuando se incluyan campos de fecha deben ir entre comillas para garantizar su correcta interpretación【F:client/src/components/nodes/NodeList.jsx†L99-L111】
