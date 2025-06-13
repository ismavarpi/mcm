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
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RestoreIcon from '@mui/icons-material/Restore';
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
        <IconButton onClick={() => csvExport(params)}>
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Exportar PDF">
        <IconButton onClick={() => pdfExport(params)}>
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
        <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
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
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(param)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset">
                      <IconButton color="secondary" onClick={() => handleReset(param.id)}>
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>

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
                  <Tooltip title="Editar">
                    <IconButton onClick={() => openEdit(param)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset">
                    <IconButton color="secondary" onClick={() => handleReset(param.id)}>
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Editar' : 'Nuevo'} parámetro</DialogTitle>
        <DialogContent>
          <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField required label="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} fullWidth />
          <TextField required label="Valor por defecto" value={form.defaultValue} onChange={(e) => setForm({ ...form, defaultValue: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
