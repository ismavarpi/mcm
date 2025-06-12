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
import FilterListIcon from '@mui/icons-material/FilterList';
import { jsPDF } from 'jspdf';

function csvExport(data) {
  const header = 'Nombre;Valor;Por defecto';
  const rows = data.map(p => `${p.name};${p.value};${p.defaultValue}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'parametros.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Parámetros', 10, 10);
  let y = 20;
  data.forEach(p => {
    doc.text(`${p.name} - ${p.value} (defecto: ${p.defaultValue})`, 10, y);
    y += 10;
  });
  doc.save('parametros.pdf');
}

export default function ParameterList() {
  const [params, setParams] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '', value: '', defaultValue: '' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });

  const load = async () => {
    const res = await axios.get('/api/parameters');
    setParams(res.data);
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/parameters/${editing.id}`, form);
    } else {
      await axios.post('/api/parameters', form);
    }
    setOpen(false);
    setForm({ name: '', value: '', defaultValue: '' });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      await axios.delete(`/api/parameters/${id}`);
      load();
    }
  };

  const handleReset = async (id) => {
    await axios.post(`/api/parameters/${id}/reset`);
    load();
  };

  const openEdit = (param) => {
    setEditing(param);
    setForm({ name: param.name, value: param.value, defaultValue: param.defaultValue });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', value: '', defaultValue: '' });
    setOpen(true);
  };

  const filtered = params.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.value.toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = filtered.sort((a,b)=>{
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
      <Button onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
        Cambiar vista
      </Button>
      <Button onClick={openCreate}>Nuevo</Button>
      <Button onClick={() => csvExport(params)}>Exportar CSV</Button>
      <Button onClick={() => pdfExport(params)}>Exportar PDF</Button>
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
            <TableHead>
              <TableRow>
                <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell onClick={() => toggleSort('value')} style={{ fontWeight: 'bold' }}>Valor</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Por defecto</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((param) => (
                <TableRow key={param.id}>
                  <TableCell>{param.name}</TableCell>
                  <TableCell>{param.value}</TableCell>
                  <TableCell>{param.defaultValue}</TableCell>
                  <TableCell>
                    <Button onClick={() => openEdit(param)}>Editar</Button>
                    <Button color="secondary" onClick={() => handleReset(param.id)}>Reset</Button>
                    <Button color="error" onClick={() => handleDelete(param.id)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {sorted.map((param) => (
            <Grid item xs={12} md={4} key={param.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{param.name}</Typography>
                  <Typography>{param.value}</Typography>
                  <Typography variant="caption">Por defecto: {param.defaultValue}</Typography>
                  <Button onClick={() => openEdit(param)}>Editar</Button>
                  <Button color="secondary" onClick={() => handleReset(param.id)}>Reset</Button>
                  <Button color="error" onClick={() => handleDelete(param.id)}>Eliminar</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Editar' : 'Nuevo'} parámetro</DialogTitle>
        <DialogContent>
          <TextField required label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField required label="Valor *" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} fullWidth />
          <TextField required label="Valor por defecto *" value={form.defaultValue} onChange={(e) => setForm({ ...form, defaultValue: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
