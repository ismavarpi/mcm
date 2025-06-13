import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ModelList from './ModelList';
import ParameterList from './ParameterList';

export default function AdminPage() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Modelos" />
        <Tab label="Parámetros" />
      </Tabs>
      {tab === 0 && <ModelList enableNodeEdit={false} />}
      {tab === 1 && <ParameterList />}
    </Box>
  );
}
