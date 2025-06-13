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
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';
import { jsPDF } from 'jspdf';

function csvExport(data) {
  const header = 'Nombre';
  const rows = data.map(c => `${c.name}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'categorias.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Categorías', 10, 10);
  let y = 20;
  data.forEach(c => {
    doc.text(c.name, 10, y);
    y += 10;
  });
  doc.save('categorias.pdf');
}

export default function DocumentCategoryList({ open, onClose }) {
  const [cats, setCats] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });

  const load = async () => {
    const res = await axios.get('/api/document-categories');
    setCats(res.data);
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/document-categories/${editing.id}`, form);
    } else {
      await axios.post('/api/document-categories', form);
    }
    setDialogOpen(false);
    setForm({ name: '' });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      await axios.delete(`/api/document-categories/${id}`);
      load();
    }
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '' });
    setDialogOpen(true);
  };

  const filtered = cats.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase())
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Categorías de documento</DialogTitle>
      <DialogContent>
        <Button onClick={() => setView(view === 'table' ? 'cards' : 'table')}>Cambiar vista</Button>
        <Button onClick={openCreate}>Nueva</Button>
        <Button onClick={() => csvExport(cats)}>Exportar CSV</Button>
        <Button onClick={() => pdfExport(cats)}>Exportar PDF</Button>
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
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
                  <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>
                      <Button onClick={() => openEdit(cat)}>Editar</Button>
                      <Button color="error" onClick={() => handleDelete(cat.id)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {sorted.map((cat) => (
              <Grid item xs={12} md={4} key={cat.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{cat.name}</Typography>
                    <Button onClick={() => openEdit(cat)}>Editar</Button>
                    <Button color="error" onClick={() => handleDelete(cat.id)}>Eliminar</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editing ? 'Editar' : 'Nueva'} categoría</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ name: e.target.value })} fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
