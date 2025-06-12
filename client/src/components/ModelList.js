import React from 'react';
import axios from 'axios';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import Typography from "@mui/material/Typography";
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';

export default function ModelList() {
  const [models, setModels] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '', author: '' });

  const load = async () => {
    const res = await axios.get('/api/models');
    setModels(res.data);
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/models/${editing.id}`, form);
    } else {
      await axios.post('/api/models', form);
    }
    setOpen(false);
    setForm({ name: '', author: '' });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      await axios.delete(`/api/models/${id}`);
      load();
    }
  };

  const openEdit = (model) => {
    setEditing(model);
    setForm({ name: model.name, author: model.author });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', author: '' });
    setOpen(true);
  };

  return (
    <div>
      <Button onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
        Cambiar vista
      </Button>
      <Button onClick={openCreate}>Nuevo</Button>
      {view === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Autor</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.author}</TableCell>
                  <TableCell>
                    <Button onClick={() => openEdit(model)}>Editar</Button>
                    <Button color="error" onClick={() => handleDelete(model.id)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {models.map((model) => (
            <Grid item xs={12} md={4} key={model.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{model.name}</Typography>
                  <Typography>{model.author}</Typography>
                  <Button onClick={() => openEdit(model)}>Editar</Button>
                  <Button color="error" onClick={() => handleDelete(model.id)}>Eliminar</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Editar' : 'Nuevo'} modelo</DialogTitle>
        <DialogContent>
          <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField required label="Autor" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
