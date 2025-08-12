---
title: 'Export'
description: 'Notas sobre exportaciones de datos.'
---


Generación de script SQL a partir del fichero XML ubicado en `import`.

Ejecutar desde la raíz del repositorio:

```
cd server
npm run xml2sql
```

El archivo `import.sql` se creará en esta carpeta `export` y podrá cargarse en la aplicación mediante la función de Importación. El script se conecta a la base de datos para calcular los siguientes identificadores libres y genera únicamente instrucciones `INSERT`, por lo que el fichero resultante es compatible con la pantalla "Administración > Importación /exportación".
