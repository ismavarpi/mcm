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
import IconButton from '@mui/material/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';
import Chip from '@mui/material/Chip';
import { jsPDF } from 'jspdf';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function csvExport(data) {
  const header = 'Nombre;Nodo padre;Modelo';
  const rows = data.map(n => `${n.name};${n.parentId || ''};${n.modelId}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'nodos.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pdfExport(data) {
  const doc = new jsPDF();
  doc.text('Nodos', 10, 10);
  let y = 20;
  data.forEach(n => {
    doc.text(`${n.name} - padre: ${n.parentId || 'ninguno'}`, 10, y);
    y += 10;
  });
  doc.save('nodos.pdf');
}

export default function NodeList({ modelId, open, onClose }) {
  const [nodes, setNodes] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', parentId: '' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [selectedTags, setSelectedTags] = React.useState([]);

  const load = async () => {
    const [nodesRes, tagsRes] = await Promise.all([
      axios.get(`/api/models/${modelId}/nodes`),
      axios.get(`/api/models/${modelId}/tags`)
    ]);
    setNodes(nodesRes.data);
    setTags(tagsRes.data);
  };

  React.useEffect(() => { if (open) load(); }, [open]);

  const handleSave = async () => {
    const payload = {
      ...form,
      parentId: form.parentId || null,
      tagIds: selectedTags,
    };
    if (editing) {
      await axios.put(`/api/nodes/${editing.id}`, payload);
    } else {
      await axios.post(`/api/models/${modelId}/nodes`, payload);
    }
    setDialogOpen(false);
    setForm({ name: '', parentId: '' });
    setSelectedTags([]);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este nodo y todos sus nodos hijos?')) {
      await axios.delete(`/api/nodes/${id}`);
      load();
    }
  };

  const openEdit = (node) => {
    setEditing(node);
    setForm({ name: node.name, parentId: node.parentId || '' });
    setSelectedTags(node.tags ? node.tags.map(t => t.id) : []);
    setDialogOpen(true);
  };

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ name: '', parentId });
    setSelectedTags([]);
    setDialogOpen(true);
  };

  const renderTree = (parentId = null) => {
    return nodes
      .filter(n => n.parentId === parentId && n.name.toLowerCase().includes(filter.toLowerCase()))
      .map(n => (
        <TreeItem
          key={n.id}
          nodeId={String(n.id)}
          label={
            <div>
              {n.name}
              {n.tags && n.tags.map(tag => (
                <span
                  key={tag.id}
                  style={{
                    backgroundColor: tag.bgColor,
                    color: tag.textColor,
                    padding: '0 0.25rem',
                    marginLeft: '0.25rem',
                    borderRadius: '4px'
                  }}
                >
                  {tag.name}
                </span>
              ))}
              <Button size="small" onClick={() => openCreate(n.id)}>Añadir</Button>
              <Button size="small" onClick={() => openEdit(n)}>Editar</Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(n.id)}
                disabled={n.name === 'Raiz' && n.parentId === null}
              >
                Eliminar
              </Button>
            </div>
          }
        >
          {renderTree(n.id)}
        </TreeItem>
      ));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Nodos</DialogTitle>
      <DialogContent>
        <Button onClick={() => openCreate('')}>Nuevo nodo raíz</Button>
        <Button onClick={() => csvExport(nodes)}>Exportar CSV</Button>
        <Button onClick={() => pdfExport(nodes)}>Exportar PDF</Button>
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          <FilterListIcon />
        </IconButton>
        {showFilters && (
          <div style={{ margin: '1rem 0' }}>
            <TextField label="Buscar" value={filter} onChange={e => setFilter(e.target.value)} />
            <Button onClick={() => setFilter('')}>Reset</Button>
          </div>
        )}
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          {renderTree(null)}
        </TreeView>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} nodo</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Nodo padre</InputLabel>
              <Select
                label="Nodo padre"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <MenuItem value=""><em>Ninguno</em></MenuItem>
                {nodes.filter(n => !editing || n.id !== editing.id).map(n => (
                  <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Etiquetas</InputLabel>
              <Select
                multiple
                label="Etiquetas"
                value={selectedTags}
                onChange={e => setSelectedTags(e.target.value)}
                renderValue={selected => (
                  <div>
                    {selected.map(id => {
                      const tag = tags.find(t => t.id === id);
                      return (
                        <span
                          key={id}
                          style={{
                            backgroundColor: tag.bgColor,
                            color: tag.textColor,
                            padding: '0 0.25rem',
                            marginRight: '0.25rem',
                            borderRadius: '4px'
                          }}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <span style={{ backgroundColor: tag.bgColor, color: tag.textColor, padding: '0 0.25rem', borderRadius: '4px' }}>
                      {tag.name}
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

