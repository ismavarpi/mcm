// Importamos la librería principal de React
import React from 'react';
// Cabecera de la aplicación
import Header from './components/Header';
// Componente que muestra los modelos
import ModelList from './components/models/ModelList';
// Página de administración
import AdminPage from './components/AdminPage';
import HelpPage from './components/HelpPage';
// Cliente HTTP para peticiones a la API
import axios from 'axios';
// Contenedor de Material UI para centrar el contenido
import Container from '@mui/material/Container';

// Componente principal de la aplicación
function App() {
  // Estado para mostrar u ocultar la página de administración
  const [showAdmin, setShowAdmin] = React.useState(false);
  // Estado para controlar la vista de modelos públicos
  const [showPublicModels, setShowPublicModels] = React.useState(false);
  // Estado para mostrar la ayuda
  const [showHelp, setShowHelp] = React.useState(false);
  // Nombre de la aplicación mostrado en la cabecera
  const [appName, setAppName] = React.useState('MCM');

  // Obtiene el nombre configurado para la aplicación desde la API
  const loadName = async () => {
    try {
      const res = await axios.get('/api/parameters/byName/Nombre%20de%20la%20aplicaci%C3%B3n');
      // Actualizamos el nombre y el título del documento con la respuesta
      setAppName(res.data.value);
      document.title = res.data.value;
    } catch (e) {
      // Si falla, mantenemos el título actual
      document.title = appName;
    }
  };

  // Cargamos el nombre la primera vez que se monta el componente
  React.useEffect(() => { loadName(); }, []);

  // Cierra cualquier vista abierta
  const closeAll = () => { setShowAdmin(false); setShowPublicModels(false); setShowHelp(false); };

  return (
    <div>
      {/* Cabecera con opciones para cambiar de vista */}
      <Header appName={appName}
              onModels={() => { closeAll(); setShowPublicModels(true); }}
              onAdmin={() => { closeAll(); setShowAdmin(true); }}
              onHelp={() => { closeAll(); setShowHelp(true); }} />
      {/* Contenedor principal de la página */}
      <Container sx={{ mt: 2 }}>
        {/* Si se activa la vista de modelos públicos los mostramos */}
        {showPublicModels && <ModelList readOnly initialView="cards" enableNodeEdit />}
        {/* Si estamos en la zona de administración se muestra */}
        {showAdmin && <AdminPage />}
        {showHelp && (
          <HelpPage
            onGoModels={() => { closeAll(); setShowPublicModels(true); }}
            onGoAdmin={() => { closeAll(); setShowAdmin(true); }}
          />
        )}

      </Container>
    </div>
  );
}

export default App;
