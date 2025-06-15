import React from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import useProcessingAction from '../../hooks/useProcessingAction';

export default function JiraExport({ open, modelId, onClose }) {
  const [tab, setTab] = React.useState(0);
  const [url, setUrl] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [projects, setProjects] = React.useState([]);
  const [projectKey, setProjectKey] = React.useState('');
  const [log, setLog] = React.useState('');

  React.useEffect(() => {
    if (open) {
      axios.get('/api/parameters').then(res => {
        const p = {};
        res.data.forEach(pr => { p[pr.name] = pr.value; });
        setUrl(p['Jira URL'] || '');
        setEmail(p['Jira usuario'] || '');
        setToken(p['Jira token'] || '');
      });
    } else {
      setLog('');
    }
  }, [open]);

  const [loadProjects, loadingProjects] = useProcessingAction(async () => {
    const res = await axios.post('/api/jira/projects', { url, email, token });
    setProjects(res.data);
  });

  const [runExport, exporting] = useProcessingAction(async () => {
    if (tab === 0) {
      window.location = `/api/models/${modelId}/jira-file`;
    } else {
      const res = await axios.post(`/api/models/${modelId}/jira-api`, {
        url,
        email,
        token,
        projectKey,
      });
      setLog(res.data.log.join('\n'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exportar a Jira</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Fichero" />
          <Tab label="API" />
        </Tabs>
        {tab === 0 && (
          <div style={{ marginTop: '1rem' }}>
            <Button variant="contained" onClick={runExport} disabled={exporting}>
              Exportar
            </Button>
          </div>
        )}
        {tab === 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField required label="URL" value={url} onChange={e => setUrl(e.target.value)} />
            <TextField required label="Usuario" value={email} onChange={e => setEmail(e.target.value)} />
            <TextField required label="Token" value={token} onChange={e => setToken(e.target.value)} />
            <Button variant="outlined" onClick={loadProjects} disabled={loadingProjects}>Cargar proyectos</Button>
            {projects.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Proyecto</InputLabel>
                <Select label="Proyecto" value={projectKey} onChange={e => setProjectKey(e.target.value)}>
                  {projects.map(p => (
                    <MenuItem key={p.key} value={p.key}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="contained" onClick={runExport} disabled={exporting || !projectKey}>Exportar</Button>
            {log && (
              <TextField label="Log" multiline fullWidth value={log} InputProps={{ readOnly: true }} />
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting || loadingProjects}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
