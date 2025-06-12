import React from 'react';
import Header from './components/Header';
import ModelList from './components/ModelList';
import Container from '@mui/material/Container';

function App() {
  const [showModels, setShowModels] = React.useState(false);

  return (
    <div>
      <Header onAdmin={() => setShowModels(true)} />
      <Container sx={{ mt: 2 }}>
        {showModels && <ModelList />}
      </Container>
    </div>
  );
}

export default App;
