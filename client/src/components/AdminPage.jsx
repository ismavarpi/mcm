import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ModelList from './models/ModelList';
import ParameterList from './parameters/ParameterList';
import DataTransfer from './data/DataTransfer';

export default function AdminPage() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Modelos" />
        <Tab label="Parámetros" />
        <Tab label="Importación/Exportación" />
      </Tabs>
      {tab === 0 && <ModelList enableNodeEdit={false} />}
      {tab === 1 && <ParameterList />}
      {tab === 2 && <DataTransfer />}
    </Box>
  );
}
