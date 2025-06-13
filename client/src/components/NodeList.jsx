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
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { jsPDF } from 'jspdf';
import { SimpleTreeView as TreeView } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view';
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
  const [teams, setTeams] = React.useState([]);
  const [roles, setRoles] = React.useState({});
  const [rasciLines, setRasciLines] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [attachments, setAttachments] = React.useState([]);
  const [attForm, setAttForm] = React.useState({ categoryId: '', name: '', file: null });

  const load = async () => {
    const [nodesRes, tagsRes, teamsRes] = await Promise.all([
      axios.get(`/api/models/${modelId}/nodes`),
      axios.get(`/api/models/${modelId}/tags`),
      axios.get(`/api/models/${modelId}/teams`)
    ]);
    const rolesMap = {};
    await Promise.all(
      teamsRes.data.map(async t => {
        const r = await axios.get(`/api/teams/${t.id}/roles`);
        rolesMap[t.id] = r.data;
      })
    );
    setTeams(teamsRes.data);
    setRoles(rolesMap);
    setNodes(nodesRes.data);
    setTags(tagsRes.data);
  };

  const loadCategories = async () => {
    const res = await axios.get(`/api/models/${modelId}/categoria-documentos`);
    setCategories(res.data);
  };

  const loadAttachments = async (id) => {
    const res = await axios.get(`/api/nodes/${id}/attachments`);
    setAttachments(res.data);
  };

  React.useEffect(() => { if (open) { load(); loadCategories(); } }, [open]);

  const handleSave = async () => {
    const countA = rasciLines.filter(l => l.responsibilities.includes('A')).length;
    const countR = rasciLines.filter(l => l.responsibilities.includes('R')).length;
    if (countA > 1 || countR > 1) {
      alert('Solo puede haber un rol con responsabilidad A y uno con responsabilidad R');
      return;
    }
    const payload = {
      ...form,
      parentId: form.parentId || null,
      tagIds: selectedTags,
      rasci: rasciLines.map(l => ({ roleId: l.roleId, responsibilities: l.responsibilities }))
    };
    if (editing) {
      await axios.put(`/api/nodes/${editing.id}`, payload);
    } else {
      await axios.post(`/api/models/${modelId}/nodes`, payload);
    }
    setDialogOpen(false);
    setForm({ name: '', parentId: '' });
    setSelectedTags([]);
    setRasciLines([]);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este nodo y todos sus nodos hijos?')) {
      await axios.delete(`/api/nodes/${id}`);
      load();
    }
  };

  const openEdit = async (node) => {
    setEditing(node);
    setForm({ name: node.name, parentId: node.parentId || '' });
    setSelectedTags(node.tags ? node.tags.map(t => t.id) : []);
    const rasciRes = await axios.get(`/api/nodes/${node.id}/rascis`);
    const sorted = rasciRes.data.sort((a,b)=>{
      const ta = teams.find(t=>t.id===a.Role.teamId)||{order:0};
      const tb = teams.find(t=>t.id===b.Role.teamId)||{order:0};
      if(ta.order!==tb.order) return ta.order-tb.order;
      const ra = roles[ta.id]?.find(r=>r.id===a.roleId)||{order:0};
      const rb = roles[tb.id]?.find(r=>r.id===b.roleId)||{order:0};
      return ra.order-rb.order;
    });
    setRasciLines(sorted.map(r=>({id:r.id, teamId:r.Role.teamId, roleId:r.roleId, responsibilities:r.responsibilities.split('')})));
    loadAttachments(node.id);
    setDialogOpen(true);
  };

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ name: '', parentId });
    setSelectedTags([]);
    setRasciLines([]);
    setAttachments([]);
    setAttForm({ categoryId: '', name: '', file: null });
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
              <Tooltip title="Añadir">
                <IconButton size="small" onClick={() => openCreate(n.id)}>
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => openEdit(n)}>
                  <EditIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(n.id)}
                  disabled={n.name === 'Raiz' && n.parentId === null}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
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
        <Tooltip title="Nuevo nodo raíz">
          <IconButton onClick={() => openCreate('')}>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar CSV">
          <IconButton onClick={() => csvExport(nodes)}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar PDF">
          <IconButton onClick={() => pdfExport(nodes)}>
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
        <TreeView
          slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
        >
          {renderTree(null)}
        </TreeView>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} nodo</DialogTitle>
          <DialogContent>
            <TextField required label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
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
            {rasciLines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                <FormControl sx={{ mr: 1, minWidth: 120 }}>
                  <InputLabel>Equipo</InputLabel>
                  <Select
                    label="Equipo"
                    value={line.teamId || ''}
                    onChange={e => {
                      const newLines = [...rasciLines];
                      newLines[idx].teamId = e.target.value;
                      newLines[idx].roleId = '';
                      setRasciLines(newLines);
                    }}
                  >
                    {teams.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ mr: 1, minWidth: 120 }}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    label="Rol"
                    value={line.roleId || ''}
                    onChange={e => {
                      const newLines = [...rasciLines];
                      newLines[idx].roleId = e.target.value;
                      setRasciLines(newLines);
                    }}
                  >
                    {(roles[line.teamId] || []).map(r => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {['R','A','S','C','I'].map(ch => (
                  <FormControlLabel
                    key={ch}
                    control={
                      <Checkbox
                        checked={line.responsibilities.includes(ch)}
                        onChange={e => {
                          const newLines = [...rasciLines];
                          if (e.target.checked) {
                            newLines[idx].responsibilities.push(ch);
                          } else {
                            newLines[idx].responsibilities = newLines[idx].responsibilities.filter(c => c !== ch);
                          }
                          setRasciLines(newLines);
                        }}
                      />
                    }
                    label={ch}
                  />
                ))}
                <Button color="error" onClick={() => {
                  setRasciLines(rasciLines.filter((_,i)=>i!==idx));
                }}>Eliminar</Button>
              </div>
            ))}
            <Button sx={{ mt: 2 }} onClick={() => setRasciLines([...rasciLines, { teamId: '', roleId: '', responsibilities: [] }])}>Añadir RASCI</Button>
            {editing && (
              <>
                <div style={{ marginTop: '1rem' }}>
                  <FormControl fullWidth required sx={{ mt: 2 }}>
                    <InputLabel>Categoría de documentos</InputLabel>
                    <Select
                      label="Categoría de documentos"
                      value={attForm.categoryId}
                      onChange={e => setAttForm({ ...attForm, categoryId: e.target.value })}
                    >
                      {categories.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    required
                    label="Nombre fichero"
                    value={attForm.name}
                    onChange={e => setAttForm({ ...attForm, name: e.target.value })}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                  <input
                    type="file"
                    onChange={e => setAttForm({ ...attForm, file: e.target.files[0] })}
                    style={{ marginTop: '1rem' }}
                  />
                  <Button
                    onClick={async () => {
                      if (!attForm.file) return;
                      const fd = new FormData();
                      fd.append('file', attForm.file);
                      fd.append('name', attForm.name);
                      fd.append('categoryId', attForm.categoryId);
                      await axios.post(`/api/nodes/${editing.id}/attachments`, fd);
                      setAttForm({ categoryId: '', name: '', file: null });
                      loadAttachments(editing.id);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Subir
                  </Button>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {attachments.map(att => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Chip label={att.CategoriaDocumento.name} sx={{ mr: 1 }} />
                      <a href={`/${att.filePath}`} target="_blank" rel="noopener noreferrer">{att.name}</a>
                      <Tooltip title="Eliminar archivo">
                        <IconButton color="error" size="small" sx={{ ml: 1 }} onClick={async () => { if (window.confirm('¿Eliminar archivo?')) { await axios.delete(`/api/attachments/${att.id}`); loadAttachments(editing.id); } }}>
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </>
            )}
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

