import React from 'react';
import axios from 'axios';
import useProcessingAction from '../../hooks/useProcessingAction';
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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { jsPDF } from 'jspdf';

function csvExport(data) {
  const header = 'Nombre;Color fondo;Color texto';
  const rows = data.map(t => `${t.name};${t.bgColor};${t.textColor}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'tags.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Etiquetas', 10, 10);
  let y = 20;
  data.forEach(t => {
    doc.text(`${t.name} - ${t.bgColor} - ${t.textColor}`, 10, y);
    y += 10;
  });
  doc.save('tags.pdf');
}

export default function TagList({ modelId, open, onClose }) {
  const [tags, setTags] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState('table');
  const [form, setForm] = React.useState({ name: '', bgColor: '#ffffff', textColor: '#000000' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });

  const load = async () => {
    const res = await axios.get(`/api/models/${modelId}/tags`);
    setTags(res.data);
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const [save, saving] = useProcessingAction(async () => {
    if (editing) {
      await axios.put(`/api/tags/${editing.id}`, form);
    } else {
      await axios.post(`/api/models/${modelId}/tags`, form);
    }
    setDialogOpen(false);
    setForm({ name: '', bgColor: '#ffffff', textColor: '#000000' });
    setEditing(null);
    load();
  });

  const [remove, removing] = useProcessingAction(async (id) => {
    await axios.delete(`/api/tags/${id}`);
    load();
  });

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      remove(id);
    }
  };

  const openEdit = (tag) => {
    setEditing(tag);
    setForm({ name: tag.name, bgColor: tag.bgColor, textColor: tag.textColor });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', bgColor: '#ffffff', textColor: '#000000' });
    setDialogOpen(true);
  };

  const filtered = tags.filter(t =>
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
      <DialogTitle>Etiquetas</DialogTitle>
      <DialogContent>
        <Tooltip title={view === 'table' ? 'Vista tarjetas' : 'Vista tabla'}>
          <IconButton onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
            {view === 'table' ? <ViewModuleIcon /> : <TableRowsIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Nueva">
          <IconButton onClick={openCreate}>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar CSV">
          <IconButton onClick={() => csvExport(tags)}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar PDF">
          <IconButton onClick={() => pdfExport(tags)}>
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
                  <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                    Nombre {sort.key === 'name' && (sort.dir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                  </TableCell>
                  <TableCell onClick={() => toggleSort('bgColor')} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                    Color fondo {sort.key === 'bgColor' && (sort.dir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                  </TableCell>
                  <TableCell onClick={() => toggleSort('textColor')} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                    Color texto {sort.key === 'textColor' && (sort.dir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>
                      <span style={{ backgroundColor: tag.bgColor, padding: '0.2rem 0.5rem', color: tag.textColor }}>
                        {tag.bgColor}
                      </span>
                    </TableCell>
                    <TableCell>{tag.textColor}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => openEdit(tag)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(tag.id)} disabled={removing}>
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
            {sorted.map((tag) => (
              <Grid item xs={12} md={4} key={tag.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{tag.name}</Typography>
                    <div style={{ backgroundColor: tag.bgColor, color: tag.textColor, padding: '0.5rem' }}>
                      {tag.name}
                    </div>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(tag)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(tag.id)} disabled={removing}>
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
          <DialogTitle>{editing ? 'Editar' : 'Nueva'} etiqueta</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField required label="Color fondo" type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} fullWidth sx={{ mt: 2 }} />
            <TextField required label="Color texto" type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} fullWidth sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
