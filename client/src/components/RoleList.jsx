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
  const header = 'Nombre;Orden';
  const rows = data.map(r => `${r.name};${r.order}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'roles.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Roles', 10, 10);
  let y = 20;
  data.forEach(r => {
    doc.text(`${r.order} - ${r.name}`, 10, y);
    y += 10;
  });
  doc.save('roles.pdf');
}

export default function RoleList({ teamId, teamName, open, onClose }) {
  const [roles, setRoles] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '', order: 0 });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'order', dir: 'asc' });

  const load = async () => {
    const res = await axios.get(`/api/teams/${teamId}/roles`);
    setRoles(res.data);
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/roles/${editing.id}`, form);
    } else {
      await axios.post(`/api/teams/${teamId}/roles`, form);
    }
    setDialogOpen(false);
    setForm({ name: '', order: 0 });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      await axios.delete(`/api/roles/${id}`);
      load();
    }
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({ name: role.name, order: role.order });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', order: 0 });
    setDialogOpen(true);
  };

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase())
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{`Roles del equipo ${teamName}`}</DialogTitle>
      <DialogContent>
        <Button onClick={() => setView(view === 'table' ? 'cards' : 'table')}>Cambiar vista</Button>
        <Button onClick={openCreate}>Nuevo</Button>
        <Button onClick={() => csvExport(roles)}>Exportar CSV</Button>
        <Button onClick={() => pdfExport(roles)}>Exportar PDF</Button>
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
                  <TableCell onClick={() => toggleSort('order')} style={{ fontWeight: 'bold' }}>Orden</TableCell>
                  <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.order}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>
                      <Button onClick={() => openEdit(role)}>Editar</Button>
                      <Button color="error" onClick={() => handleDelete(role.id)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {sorted.map((role) => (
              <Grid item xs={12} md={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{role.order} - {role.name}</Typography>
                    <Button onClick={() => openEdit(role)}>Editar</Button>
                    <Button color="error" onClick={() => handleDelete(role.id)}>Eliminar</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} rol</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField required label="Orden *" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) })} fullWidth sx={{ mt: 2 }} />
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
