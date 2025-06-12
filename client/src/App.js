import React from 'react';
import Header from './components/Header';
import ModelList from './components/ModelList';
import ParameterList from './components/ParameterList';
import axios from 'axios';
import Container from '@mui/material/Container';

function App() {
  const [showModels, setShowModels] = React.useState(false);
  const [showParams, setShowParams] = React.useState(false);
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

  const closeAll = () => { setShowModels(false); setShowParams(false); };

  return (
    <div>
      <Header appName={appName} onAdmin={() => { closeAll(); setShowModels(true); }} onParams={() => { closeAll(); setShowParams(true); }} />
      <Container sx={{ mt: 2 }}>
        {showModels && <ModelList />}
        {showParams && <ParameterList />}
      </Container>
    </div>
  );
}

export default App;
