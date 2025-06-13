// Bibliotecas principales de React
import React from 'react';
import ReactDOM from 'react-dom/client';
// Estilos globales de la aplicación
import './index.css';
// Componente principal de la aplicación
import App from './App.jsx';
import { ProcessingProvider } from './hooks/useProcessing';

// Creamos el nodo raíz donde se montará React
const root = ReactDOM.createRoot(document.getElementById('root'));
// Renderizamos la aplicación dentro de React.StrictMode
root.render(
  <React.StrictMode>
    <ProcessingProvider>
      <App />
    </ProcessingProvider>
  </React.StrictMode>
);
