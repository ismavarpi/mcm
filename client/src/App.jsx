import React from 'react';
import Header from './components/Header';
import ModelList from './components/ModelList';
import ParameterList from './components/ParameterList';
import DocumentCategoryList from './components/DocumentCategoryList';
import axios from 'axios';
import Container from '@mui/material/Container';

function App() {
  const [showModels, setShowModels] = React.useState(false);
  const [showPublicModels, setShowPublicModels] = React.useState(false);
  const [showParams, setShowParams] = React.useState(false);
  const [showCats, setShowCats] = React.useState(false);
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

  const closeAll = () => { setShowModels(false); setShowParams(false); setShowPublicModels(false); setShowCats(false); };

  return (
    <div>
      <Header appName={appName}
              onModels={() => { closeAll(); setShowPublicModels(true); }}
              onAdmin={() => { closeAll(); setShowModels(true); }}
              onCategories={() => { closeAll(); setShowCats(true); }}
              onParams={() => { closeAll(); setShowParams(true); }} />
      <Container sx={{ mt: 2 }}>
        {showPublicModels && <ModelList readOnly initialView="cards" />}
        {showModels && <ModelList />}
        {showCats && <DocumentCategoryList />}
        {showParams && <ParameterList />}
      </Container>
    </div>
  );
}

export default App;
