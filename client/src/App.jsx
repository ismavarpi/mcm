import React from 'react';
import Header from './components/Header';
import ModelList from './components/ModelList';
import AdminPage from './components/AdminPage';
import axios from 'axios';
import Container from '@mui/material/Container';

function App() {
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [showPublicModels, setShowPublicModels] = React.useState(false);
  const [appName, setAppName] = React.useState('MCM');

  const loadName = async () => {
    try {
      const res = await axios.get('/api/parameters/byName/Nombre%20de%20la%20aplicaci%C3%B3n');
      setAppName(res.data.value);
      document.title = res.data.value;
    } catch (e) {
      document.title = appName;
    }
  };

  React.useEffect(() => { loadName(); }, []);

  const closeAll = () => { setShowAdmin(false); setShowPublicModels(false); };

  return (
    <div>
      <Header appName={appName}
              onModels={() => { closeAll(); setShowPublicModels(true); }}
              onAdmin={() => { closeAll(); setShowAdmin(true); }} />
      <Container sx={{ mt: 2 }}>
        {showPublicModels && <ModelList readOnly initialView="cards" />}
        {showAdmin && <AdminPage />}
      </Container>
    </div>
  );
}

export default App;
