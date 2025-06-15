import React from 'react';
import Link from '@mui/material/Link';

export default function HelpPage({ onGoModels, onGoAdmin }) {
  return (
    <div>
      <h1>Manual de uso</h1>
      <p>Bienvenido a la aplicación MCM. Desde aquí podrá gestionar modelos y toda su información asociada.</p>

      <h2 id="inicio">Contenido</h2>
      <ul>
        <li><a href="#modelos">Modelos</a></li>
        <li><a href="#tags">Etiquetas</a></li>
        <li><a href="#equipos">Equipos y roles</a></li>
        <li><a href="#nodos">Nodos</a></li>
        <li><a href="#importacion">Importación y exportación</a></li>
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

      <h2 id="nodos">Nodos</h2>
      <p>Los nodos contienen la información jerárquica del modelo. Puede asignarles etiquetas, adjuntar documentos y definir responsabilidades RASCI.</p>

      <h2 id="importacion">Importación y exportación</h2>
      <p>En la sección de administración encontrará utilidades para importar y exportar datos, así como la opción de exportar a Jira.</p>
    </div>
  );
}
