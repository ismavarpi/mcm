import React from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import useProcessingAction from '../../hooks/useProcessingAction';

export default function DataTransfer() {
  const [file, setFile] = React.useState(null);
  const [entities, setEntities] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [log, setLog] = React.useState('');

  const preview = async (f) => {
    const form = new FormData();
    form.append('file', f);
    const res = await axios.post('/api/data/import/preview', form);
    setEntities(res.data.entities);
    setSelected(res.data.entities);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) preview(f);
  };

  const toggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const [runImport, running] = useProcessingAction(async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('entities', JSON.stringify(selected));
    const res = await axios.post('/api/data/import', form);
    setLog(res.data.log.join('\n'));
  });

  return (
    <Box>
      <Button variant="contained" onClick={() => { window.location = '/api/data/export'; }}>
        Exportar
      </Button>
      <Box mt={2}>
        <input type="file" accept=".sql" onChange={handleFileChange} />
      </Box>
      {entities.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6">Entidades</Typography>
          {entities.map((e) => (
            <FormControlLabel
              key={e}
              control={
                <Checkbox
                  checked={selected.includes(e)}
                  onChange={() => toggle(e)}
                />
              }
              label={e}
            />
          ))}
          <Box mt={1}>
            <Button variant="contained" onClick={runImport} disabled={running}>
              Ejecutar importación
            </Button>
          </Box>
        </Box>
      )}
      {log && (
        <TextField
          label="Log"
          multiline
          fullWidth
          value={log}
          InputProps={{ readOnly: true }}
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
}
