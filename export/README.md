
Generación de script SQL a partir del fichero XML ubicado en `import`.

Ejecutar desde la raíz del repositorio:

```
cd server
npm run xml2sql
```

El archivo `import.sql` se creará en esta carpeta `export` y podrá cargarse en la aplicación mediante la función de Importación. El script calcula los identificadores partiendo del máximo existente en cada tabla para evitar colisiones.
