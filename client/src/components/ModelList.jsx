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
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FilterListIcon from '@mui/icons-material/FilterList';
import { jsPDF } from 'jspdf';
import TagList from './TagList';
import TeamList from './TeamList';
import NodeList from './NodeList';

function csvExport(data) {
  const header = 'Nombre;Autor';
  const rows = data.map(m => `${m.name};${m.author}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelos.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Modelos', 10, 10);
  let y = 20;
  data.forEach(m => {
    doc.text(`${m.name} - ${m.author}`, 10, y);
    y += 10;
  });
  doc.save('modelos.pdf');
}

function getBreadcrumb(model, models) {
  const names = [model.name];
  let current = model;
  while (current.parentId) {
    current = models.find(m => m.id === current.parentId);
    if (!current) break;
    names.unshift(current.name);
  }
  return names.join(' > ');
}

export default function ModelList({ readOnly = false, initialView = 'table' }) {
  const [models, setModels] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState(initialView);
  const [form, setForm] = React.useState({ name: '', author: '', parentId: '' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });
  const [tagsModel, setTagsModel] = React.useState(null);
  const [teamsModel, setTeamsModel] = React.useState(null);
  const [nodesModel, setNodesModel] = React.useState(null);

  const load = async () => {
    const res = await axios.get('/api/models');
    setModels(res.data);
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/models/${editing.id}`, { ...form, parentId: form.parentId || null });
    } else {
      await axios.post('/api/models', { ...form, parentId: form.parentId || null });
    }
    setOpen(false);
    setForm({ name: '', author: '', parentId: '' });
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
    setForm({ name: model.name, author: model.author, parentId: model.parentId || '' });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', author: '', parentId: '' });
    setOpen(true);
  };

  const openTags = (model) => {
    setTagsModel(model);
  };

  const openTeams = (model) => {
    setTeamsModel(model);
  };
  const openNodes = (model) => {
    setNodesModel(model);
  };

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.author.toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = filtered.sort((a,b) => {
    const valA = a[sort.key];
    const valB = b[sort.key];
    if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = key => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div>
      {!readOnly && (
        <Button onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
          Cambiar vista
        </Button>
      )}
      {!readOnly && <Button onClick={openCreate}>Nuevo</Button>}
      <Button onClick={() => csvExport(models)}>Exportar CSV</Button>
      <Button onClick={() => pdfExport(models)}>Exportar PDF</Button>
      <IconButton onClick={() => setShowFilters(!showFilters)}>
        <FilterListIcon />
      </IconButton>
      {showFilters && (
        <div style={{ margin: '1rem 0' }}>
          <TextField label="Buscar" value={filter} onChange={e => setFilter(e.target.value)} />
          <Button onClick={() => setFilter('')}>Reset</Button>
        </div>
      )}
      {view === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell onClick={() => toggleSort('author')} style={{ fontWeight: 'bold' }}>Autor</TableCell>
                {!readOnly && <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.author}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button onClick={() => openEdit(model)}>Editar</Button>
                      <Button onClick={() => openTags(model)}>Tags</Button>
                      <Button onClick={() => openTeams(model)}>Equipos y roles</Button>
                      <Button onClick={() => openNodes(model)}>Nodos</Button>
                      <Button color="error" onClick={() => handleDelete(model.id)}>Eliminar</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {sorted.map((model) => (
            <Grid item xs={12} md={4} key={model.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{getBreadcrumb(model, models)}</Typography>
                  <Typography>{model.author}</Typography>
                  {!readOnly && (
                    <>
                      <Button onClick={() => openEdit(model)}>Editar</Button>
                      <Button onClick={() => openTags(model)}>Tags</Button>
                      <Button onClick={() => openTeams(model)}>Equipos y roles</Button>
                      <Button onClick={() => openNodes(model)}>Nodos</Button>
                      <Button color="error" onClick={() => handleDelete(model.id)}>Eliminar</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Editar' : 'Nuevo'} modelo</DialogTitle>
        <DialogContent>
          <TextField required label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField required label="Autor *" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} fullWidth />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Modelo padre</InputLabel>
            <Select
              label="Modelo padre"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <MenuItem value=""><em>Ninguno</em></MenuItem>
              {models.filter(m => !editing || m.id !== editing.id).map(m => (
                <MenuItem key={m.id} value={m.id}>{getBreadcrumb(m, models)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
      {tagsModel && (
        <TagList open={!!tagsModel} modelId={tagsModel.id} onClose={() => setTagsModel(null)} />
      )}
      {teamsModel && (
        <TeamList open={!!teamsModel} modelId={teamsModel.id} onClose={() => setTeamsModel(null)} />
      )}
      {nodesModel && (
        <NodeList open={!!nodesModel} modelId={nodesModel.id} onClose={() => setNodesModel(null)} />
      )}
    </div>
  );
}
