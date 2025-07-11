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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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
import LabelIcon from '@mui/icons-material/Label';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { jsPDF } from 'jspdf';
import TagList from '../tags/TagList';
import TeamList from '../teams/TeamList';
import NodeList from '../nodes/NodeList';
import DocumentCategoryList from '../documentCategories/DocumentCategoryList';
import useProcessingAction from '../../hooks/useProcessingAction';
import JiraExport from './JiraExport';

function csvExport(data) {
  const header = 'Nombre;Autor;Publico';
  const rows = data.map(m => `${m.name};${m.author};${m.isPublic ? 'Si' : 'No'}`);
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
    const vis = m.isPublic ? 'Público' : 'Privado';
    doc.text(`${m.name} - ${m.author} - ${vis}`, 10, y);
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

export default function ModelList({ readOnly = false, initialView = 'table', enableNodeEdit = false }) {
  const [models, setModels] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [view, setView] = React.useState(initialView);
  const [form, setForm] = React.useState({ name: '', author: '', parentId: '', isPublic: false });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });
  const [tagsModel, setTagsModel] = React.useState(null);
  const [teamsModel, setTeamsModel] = React.useState(null);
  const [nodesModel, setNodesModel] = React.useState(null);
  const [categoriesModel, setCategoriesModel] = React.useState(null);
  const [jiraModel, setJiraModel] = React.useState(null);

  const load = async () => {
    const res = await axios.get('/api/models');
    setModels(res.data);
  };

  React.useEffect(() => { load(); }, []);

  const [saveModel, saving] = useProcessingAction(async () => {
    if (editing && parseInt(form.parentId) === editing.id) {
      alert('Un modelo no puede ser su propio padre');
      return;
    }
    if (editing) {
      await axios.put(`/api/models/${editing.id}`, { ...form, parentId: form.parentId || null });
    } else {
      await axios.post('/api/models', { ...form, parentId: form.parentId || null });
    }
    setOpen(false);
    setForm({ name: '', author: '', parentId: '', isPublic: false });
    setEditing(null);
    load();
  });

  const [removeModel, removing] = useProcessingAction(async (id) => {
    await axios.delete(`/api/models/${id}`);
    load();
  });

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar elemento?')) {
      removeModel(id);
    }
  };

  const openEdit = (model) => {
    setEditing(model);
    setForm({ name: model.name, author: model.author, parentId: model.parentId || '', isPublic: model.isPublic });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', author: '', parentId: '', isPublic: false });
    setOpen(true);
  };

  const openTags = (model) => {
    setTagsModel(model);
  };

  const openCategories = (model) => {
    setCategoriesModel(model);
  };

  const openTeams = (model) => {
    setTeamsModel(model);
  };
  const openNodes = (model) => {
    setNodesModel(model);
  };
  const openJira = (model) => {
    setJiraModel(model);
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
        <Tooltip title={view === 'table' ? 'Vista tarjetas' : 'Vista tabla'}>
          <IconButton onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
            {view === 'table' ? <ViewModuleIcon /> : <TableRowsIcon />}
          </IconButton>
        </Tooltip>
      )}
      {!readOnly && (
        <Tooltip title="Nuevo">
          <IconButton onClick={openCreate}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Exportar CSV">
        <IconButton onClick={() => csvExport(models)}>
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Exportar PDF">
        <IconButton onClick={() => pdfExport(models)}>
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
                <TableCell onClick={() => toggleSort('name')} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                  Nombre {sort.key === 'name' && (sort.dir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                </TableCell>
                <TableCell onClick={() => toggleSort('author')} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                  Autor {sort.key === 'author' && (sort.dir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                </TableCell>
                {(!readOnly || enableNodeEdit) && (
                  <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.author}</TableCell>
                  {(!readOnly || enableNodeEdit) && (
                    <TableCell>
                      {!readOnly && (
                        <Tooltip title="Editar">
                          <IconButton onClick={() => openEdit(model)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Tags">
                        <IconButton onClick={() => openTags(model)}>
                          <LabelIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Categorías de documentos">
                        <IconButton onClick={() => openCategories(model)}>
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Equipos y roles">
                        <IconButton onClick={() => openTeams(model)}>
                          <GroupsIcon />
                        </IconButton>
                      </Tooltip>
                      {!readOnly && (
                        <Tooltip title="Exportar a Jira">
                          <IconButton onClick={() => openJira(model)}>
                            <UploadFileIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {enableNodeEdit && (
                        <Tooltip title="Nodos">
                          <IconButton onClick={() => openNodes(model)}>
                            <AccountTreeIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!readOnly && (
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDelete(model.id)} disabled={removing}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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
              <Card style={{ position: 'relative' }}>
                <CardContent>
                  {model.isPublic ? (
                    <PublicIcon style={{ position: 'absolute', top: 8, right: 8 }} />
                  ) : (
                    <LockIcon style={{ position: 'absolute', top: 8, right: 8 }} />
                  )}
                  <Typography variant="h6">{getBreadcrumb(model, models)}</Typography>
                  <Typography>{model.author}</Typography>
                  {(!readOnly || enableNodeEdit) && (
                    <>
                      {!readOnly && (
                        <Tooltip title="Editar">
                          <IconButton onClick={() => openEdit(model)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Tags">
                        <IconButton onClick={() => openTags(model)}>
                          <LabelIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Categorías de documentos">
                        <IconButton onClick={() => openCategories(model)}>
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Equipos y roles">
                        <IconButton onClick={() => openTeams(model)}>
                          <GroupsIcon />
                        </IconButton>
                      </Tooltip>
                      {!readOnly && (
                        <Tooltip title="Exportar a Jira">
                          <IconButton onClick={() => openJira(model)}>
                            <UploadFileIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {enableNodeEdit && (
                        <Tooltip title="Nodos">
                          <IconButton onClick={() => openNodes(model)}>
                            <AccountTreeIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!readOnly && (
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDelete(model.id)} disabled={removing}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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
          <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField required label="Autor" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} fullWidth sx={{ mt: 2 }} />
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
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Visibilidad</InputLabel>
            <Select
              label="Visibilidad"
              value={form.isPublic ? 'publico' : 'privado'}
              onChange={e => setForm({ ...form, isPublic: e.target.value === 'publico' })}
            >
              <MenuItem value="publico">Público</MenuItem>
              <MenuItem value="privado">Privado</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={saveModel} disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>
      {tagsModel && (
        <TagList open={!!tagsModel} modelId={tagsModel.id} onClose={() => setTagsModel(null)} />
      )}
      {categoriesModel && (
        <DocumentCategoryList open={!!categoriesModel} modelId={categoriesModel.id} onClose={() => setCategoriesModel(null)} />
      )}
      {teamsModel && (
        <TeamList open={!!teamsModel} modelId={teamsModel.id} onClose={() => setTeamsModel(null)} />
      )}
      {enableNodeEdit && nodesModel && (
        <NodeList
          open={!!nodesModel}
          modelId={nodesModel.id}
          modelName={nodesModel.name}
          onClose={() => { setNodesModel(null); setView('cards'); }}
        />
      )}
      {jiraModel && (
        <JiraExport open={!!jiraModel} modelId={jiraModel.id} onClose={() => setJiraModel(null)} />
      )}
    </div>
  );
}
