import React from 'react';
import Link from '@mui/material/Link';

export default function HelpPage({ onGoModels, onGoAdmin }) {
  return (
    <div>
      <h1>Manual de uso</h1>
      <p>Bienvenido a la aplicación MCM. Desde aquí podrá gestionar modelos y toda su información asociada.</p>

      <h2 id="inicio">Contenido</h2>
      <ul>
        <li><a href="#administracion">Administración</a></li>
        <li><a href="#modelos">Modelos</a></li>
        <li><a href="#tags">Etiquetas</a></li>
        <li><a href="#equipos">Equipos y roles</a></li>
        <li><a href="#categorias">Categorías de documentos</a></li>
        <li><a href="#nodos">Nodos</a></li>
        <li><a href="#importacion">Importación y exportación</a></li>
      </ul>

      <h2 id="administracion">Administración</h2>
      <p>
        Desde la opción <strong>Administrar</strong> de la cabecera acceda a las
        tablas maestras de la aplicación. Cada listado permite alternar la vista
        en forma de tarjetas o tabla, ordenar por columnas, filtrar resultados y
        exportar los datos a CSV o PDF.
      </p>
      <p>A continuación se describen las opciones disponibles:</p>
      <ul>
        <li>
          <strong>Modelos</strong>: creación, edición y eliminación de modelos.
          Desde cada fila se accede a la gestión de sus etiquetas, categorías de
          documentos, equipos y nodos, así como a la exportación a Jira.
        </li>
        <li>
          <strong>Parámetros</strong>: configuración global. Puede crear,
          editar o restablecer cada parámetro a su valor por defecto.
        </li>
        <li>
          <strong>Etiquetas</strong>: definición de nombre y colores para
          clasificar nodos y modelos.
        </li>
        <li>
          <strong>Categorías de documentos</strong>: grupos para organizar los
          adjuntos de los nodos.
        </li>
        <li>
          <strong>Equipos y roles</strong>: permite dar de alta equipos de
          trabajo y, dentro de cada uno, sus roles. Incluye la opción de generar
          automáticamente las líneas RASCI.
        </li>
        <li>
          <strong>Nodos</strong>: edición de la estructura jerárquica del
          modelo, gestión de adjuntos y responsabilidades RASCI.
        </li>
      </ul>

      <h2 id="modelos">Modelos</h2>
      <p>Los modelos representan la estructura principal del conocimiento. Puede acceder a la gestión completa desde la zona de administración.</p>
      <p>
        <Link component="button" onClick={onGoModels}>Ver modelos públicos</Link>
        {' | '}
        <Link component="button" onClick={onGoAdmin}>Administrar modelos</Link>
      </p>

      <h2 id="tags">Etiquetas</h2>
      <p>Las etiquetas permiten clasificar los nodos y modelos con colores personalizables.</p>

      <h2 id="equipos">Equipos y roles</h2>
      <p>Desde cada modelo se pueden definir equipos de trabajo y sus roles asociados.</p>

      <h2 id="categorias">Categorías de documentos</h2>
      <p>Permiten organizar los adjuntos de los nodos en grupos personalizables.</p>

      <h2 id="nodos">Nodos</h2>
      <p>Los nodos contienen la información jerárquica del modelo. Puede asignarles etiquetas, adjuntar documentos y definir responsabilidades RASCI.</p>

      <h2 id="importacion">Importación y exportación</h2>
      <p>
        Acceda a estas funciones desde la cabecera pulsando
        <strong>Administrar</strong> y elija la pestaña
        <em>Importación/Exportación</em>.
      </p>
      <p>
        Para <strong>exportar</strong> simplemente haga clic en el botón
        <em>Exportar</em>. Se generará el fichero
        <code>export.sql</code> y la descarga comenzará de forma
        automática. Si la operación dura más de un segundo verá en la
        parte superior el aviso <em>Procesando...</em> con el tiempo
        transcurrido hasta que finalice.
      </p>
      <p>
        Para <strong>importar</strong> seleccione un archivo
        <code>.sql</code>. El sistema mostrará la lista de entidades
        detectadas y podrá marcar o desmarcar las que desee cargar.
        Pulse <em>Ejecutar importación</em> para iniciar el proceso. Al
        terminar, aparecerá un registro con el resultado de cada
        sentencia ejecutada.
      </p>
      <p>Desde este apartado también puede lanzar la exportación a Jira.</p>
    </div>
  );
}
