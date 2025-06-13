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
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import Badge from '@mui/material/Badge';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { jsPDF } from 'jspdf';
import RoleList from './RoleList';

function csvExport(data) {
  const header = 'Nombre;Orden';
  const rows = data.map(t => `${t.name};${t.order}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'equipos.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Equipos y roles', 10, 10);
  let y = 20;
  data.forEach(t => {
    doc.text(`${t.order} - ${t.name}`, 10, y);
    y += 10;
  });
  doc.save('equipos.pdf');
}

export default function TeamList({ modelId, open, onClose }) {
  const [teams, setTeams] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '', order: 0 });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'order', dir: 'asc' });
  const [rolesTeam, setRolesTeam] = React.useState(null);
  const [roleCounts, setRoleCounts] = React.useState({});

  const load = async () => {
    const res = await axios.get(`/api/models/${modelId}/teams`);
    const counts = {};
    await Promise.all(
      res.data.map(async t => {
        const r = await axios.get(`/api/teams/${t.id}/roles`);
        counts[t.id] = r.data.length;
      })
    );
    setRoleCounts(counts);
    setTeams(res.data);
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const handleSave = async () => {
    if (editing) {
      await axios.put(`/api/teams/${editing.id}`, form);
    } else {
      await axios.post(`/api/models/${modelId}/teams`, form);
    }
    setDialogOpen(false);
    setForm({ name: '', order: 0 });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      await axios.delete(`/api/teams/${id}`);
      load();
    }
  };

  const openEdit = (team) => {
    setEditing(team);
    setForm({ name: team.name, order: team.order });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', order: 0 });
    setDialogOpen(true);
  };

  const openRoles = (team) => {
    setRolesTeam(team);
  };

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase())
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
      <DialogTitle>Equipos y roles</DialogTitle>
      <DialogContent>
        <Tooltip title={view === 'table' ? 'Vista tarjetas' : 'Vista tabla'}>
          <IconButton onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
            {view === 'table' ? <ViewModuleIcon /> : <TableRowsIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Nuevo">
          <IconButton onClick={openCreate}>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar CSV">
          <IconButton onClick={() => csvExport(teams)}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar PDF">
          <IconButton onClick={() => pdfExport(teams)}>
            <PictureAsPdfIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Filtros">
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        {showFilters && (
          <div style={{ margin: '1rem 0' }}>
          <TextField label="Buscar" value={filter} onChange={e => setFilter(e.target.value)} />
          <Tooltip title="Reset">
            <IconButton onClick={() => setFilter('')}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
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
                {sorted.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.order}</TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => openEdit(team)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Roles">
                        <IconButton onClick={() => openRoles(team)}>
                          <Badge badgeContent={roleCounts[team.id] || 0} color="primary" overlap="circular">
                            <GroupIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(team.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {sorted.map((team) => (
              <Grid item xs={12} md={4} key={team.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{team.order} - {team.name}</Typography>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(team)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Roles">
                      <IconButton onClick={() => openRoles(team)}>
                        <Badge badgeContent={roleCounts[team.id] || 0} color="primary" overlap="circular">
                          <GroupIcon />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(team.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} equipo</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField required label="Orden" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) })} fullWidth sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogActions>
        </Dialog>
        {rolesTeam && (
          <RoleList
            open={!!rolesTeam}
            teamId={rolesTeam.id}
            teamName={rolesTeam.name}
            onClose={() => setRolesTeam(null)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
