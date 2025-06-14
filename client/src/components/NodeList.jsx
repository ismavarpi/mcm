import React from 'react';
import axios from 'axios';
import useProcessingAction from '../hooks/useProcessingAction';
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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { jsPDF } from 'jspdf';
import { SimpleTreeView as TreeView } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Autocomplete from '@mui/material/Autocomplete';

function csvExport(data) {
  const header = 'Código;Nombre;Nodo padre;Modelo';
  const rows = data.map(n => `${n.code};${n.name};${n.parentId || ''};${n.modelId}`);
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
  const map = {};
  data.forEach(n => { map[n.id] = { ...n, children: [] }; });
  data.forEach(n => { if (n.parentId && map[n.parentId]) map[n.parentId].children.push(map[n.id]); });

  const hexToRgb = (hex) => {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? [parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16)] : [0, 0, 0];
  };

  let y = 20;
  const drawNode = (node, level) => {
    const x = 10 + level * 10;
    doc.setTextColor(0, 0, 0);
    const base = `[${node.code}] ${node.name}`;
    doc.text(base, x, y);
    let tagX = x + doc.getTextWidth(base) + 2;
    (node.tags || []).forEach(tag => {
      const [r, g, b] = hexToRgb(tag.bgColor);
      const [tr, tg, tb] = hexToRgb(tag.textColor);
      const textWidth = doc.getTextWidth(tag.name) + 4;
      doc.setFillColor(r, g, b);
      doc.setTextColor(tr, tg, tb);
      doc.rect(tagX, y - 4, textWidth, 6, 'F');
      doc.text(tag.name, tagX + 2, y);
      tagX += textWidth + 2;
    });
    y += 8;
    node.children.forEach(child => drawNode(child, level + 1));
  };

  data.filter(n => !n.parentId).forEach(root => drawNode(map[root.id], 0));
  doc.save('nodos.pdf');
}

export default function NodeList({ modelId, modelName, open, onClose }) {
  const [nodes, setNodes] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ parentId: '', code: '', name: '', patternType: 'order', patternText: '' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [filterTags, setFilterTags] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [roles, setRoles] = React.useState({});
  const [rasciLines, setRasciLines] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [attachments, setAttachments] = React.useState([]);
  const [attForm, setAttForm] = React.useState({ categoryId: '', name: '', file: null });
  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState('');
  const [focusNodeId, setFocusNodeId] = React.useState(null);
  const [allExpanded, setAllExpanded] = React.useState(false);
  const [inheritedTags, setInheritedTags] = React.useState([]);
  const [tab, setTab] = React.useState(0);

  const sortedNodes = React.useMemo(() => {
    const result = [];
    const walk = (pid = null) => {
      nodes
        .filter(n => n.parentId === pid)
        .sort((a, b) => a.order - b.order)
        .forEach(n => {
          result.push(n);
          walk(n.id);
        });
    };
    walk(null);
    return result;
  }, [nodes]);

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
    setExpanded(nodesRes.data.map(n => String(n.id)));
    setTags(tagsRes.data);
  };

  React.useEffect(() => {
    setAllExpanded(nodes.length > 0 && expanded.length === nodes.length);
  }, [expanded, nodes]);

  React.useEffect(() => {
    if (focusNodeId && nodes.length) {
      const map = Object.fromEntries(nodes.map(n => [n.id, n]));
      let current = map[focusNodeId];
      const path = [];
      while (current) {
        path.unshift(String(current.id));
        current = current.parentId ? map[current.parentId] : null;
      }
      setExpanded(prev => Array.from(new Set([...prev, ...path])));
      setSelected(String(focusNodeId));
      setFocusNodeId(null);
    }
  }, [focusNodeId, nodes]);

  const loadCategories = async () => {
    const res = await axios.get(`/api/models/${modelId}/categoria-documentos`);
    setCategories(res.data);
  };

  const loadAttachments = async (id) => {
    const res = await axios.get(`/api/nodes/${id}/attachments`);
    setAttachments(res.data);
  };

  React.useEffect(() => { if (open) { load(); loadCategories(); } }, [open]);

  const [saveNode, saving] = useProcessingAction(async () => {
    const countA = rasciLines.filter(l => l.responsibilities.includes('A')).length;
    const countR = rasciLines.filter(l => l.responsibilities.includes('R')).length;
    if (countA > 1 || countR > 1) {
      alert('Solo puede haber un rol con responsabilidad A y uno con responsabilidad R');
      return;
    }
    if (form.patternType === 'text' && !form.patternText.trim()) {
      alert('El texto del patrón de código es obligatorio');
      return;
    }
    const payload = {
      name: form.name,
      parentId: form.parentId || null,
      codePattern: form.patternType === 'text' ? form.patternText.toUpperCase() : 'ORDER',
      tagIds: selectedTags,
      rasci: rasciLines.map(l => ({ roleId: l.roleId, responsibilities: l.responsibilities }))
    };
    let res;
    if (editing) {
      res = await axios.put(`/api/nodes/${editing.id}`, payload);
    } else {
      res = await axios.post(`/api/models/${modelId}/nodes`, payload);
    }
    setFocusNodeId(res.data.id);
    setDialogOpen(false);
    setForm({ parentId: '', code: '', name: '', patternType: 'order', patternText: '' });
    setSelectedTags([]);
    setRasciLines([]);
    setEditing(null);
    load();
  });

  const [removeNode, removing] = useProcessingAction(async (id) => {
    await axios.delete(`/api/nodes/${id}`);
    load();
  });

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este nodo y todos sus nodos hijos?')) {
      removeNode(id);
    }
  };

  const [moveNode, moving] = useProcessingAction(async (id, direction) => {
    await axios.post(`/api/nodes/${id}/move`, { direction });
    setFocusNodeId(id);
    load();
  });

  const openEdit = async (node) => {
    setEditing(node);
    setForm({
      parentId: node.parentId || '',
      code: node.code,
      name: node.name,
      patternType: node.codePattern === 'ORDER' ? 'order' : 'text',
      patternText: node.codePattern === 'ORDER' ? '' : node.codePattern
    });
    const parent = nodes.find(n => n.id === node.parentId);
    const inherited = parent && parent.tags ? parent.tags.map(t => t.id) : [];
    setInheritedTags(inherited);
    const nodeTagIds = node.tags ? node.tags.map(t => t.id) : [];
    setSelectedTags(Array.from(new Set([...nodeTagIds, ...inherited])));
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
    setTab(0);
    setDialogOpen(true);
  };

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ parentId, code: '', name: '', patternType: 'order', patternText: '' });
    const parent = nodes.find(n => n.id === parentId);
    const inherited = parent && parent.tags ? parent.tags.map(t => t.id) : [];
    setInheritedTags(inherited);
    setSelectedTags(inherited);
    setRasciLines([]);
    setAttachments([]);
    setAttForm({ categoryId: '', name: '', file: null });
    setTab(0);
    setDialogOpen(true);
  };

  const visibleIds = React.useMemo(() => {
    const map = Object.fromEntries(nodes.map(n => [n.id, n]));
    const ids = new Set();
    if (!filter && filterTags.length === 0) {
      nodes.forEach(n => ids.add(n.id));
      return ids;
    }
    nodes.forEach(n => {
      const matchesText = !filter || n.name.toLowerCase().includes(filter.toLowerCase());
      const matchesTags = filterTags.length === 0 || (n.tags && n.tags.some(t => filterTags.includes(t.id)));
      if (matchesText && matchesTags) {
        let current = n;
        while (current) {
          ids.add(current.id);
          current = current.parentId ? map[current.parentId] : null;
        }
      }
    });
    return ids;
  }, [nodes, filter, filterTags]);

  const renderTree = (parentId = null) => {
    const children = nodes
      .filter(n => n.parentId === parentId && visibleIds.has(n.id))
      .sort((a, b) => a.order - b.order);
    return children.map((n, idx) => (
        <TreeItem
          key={n.id}
          itemId={String(n.id)}
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <strong style={{ marginRight: '0.25rem' }}>[{n.code}]</strong>
              <span style={{ marginRight: '0.5rem' }}>{n.name}</span>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                {n.tags && n.tags.map(tag => (
                  <span
                    key={tag.id}
                    onClick={() => {
                      setShowFilters(true);
                      setFilterTags([tag.id]);
                    }}
                    style={{
                      backgroundColor: tag.bgColor,
                      color: tag.textColor,
                      padding: '0 0.25rem',
                      marginLeft: '0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <div style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Añadir">
                  <IconButton size="small" onClick={() => openCreate(n.id)} sx={{ ml: 0.5 }}>
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Subir">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => moveNode(n.id, 'up')}
                      disabled={idx === 0 || moving}
                      sx={{ ml: 0.5 }}
                    >
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Bajar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => moveNode(n.id, 'down')}
                      disabled={idx === children.length - 1 || moving}
                      sx={{ ml: 0.5 }}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => openEdit(n)} sx={{ ml: 0.5 }}>
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(n.id)}
                    disabled={(n.name === 'Raiz' && n.parentId === null) || removing}
                    sx={{ ml: 0.5 }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </div>

            </div>
          }
        >
          {renderTree(n.id)}
        </TreeItem>
      ));
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: '64px', left: 0, width: '100%', height: 'calc(100% - 64px)', backgroundColor: '#fff', overflow: 'auto', zIndex: 1300 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={onClose}>
          Volver a modelos
        </Button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Nodos del modelo</div>
          <div style={{ fontSize: '1rem', color: '#666' }}>{modelName}</div>
        </div>
      </div>
      <div style={{ padding: '1rem' }}>
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
        <Tooltip title={allExpanded ? 'Replegar todo' : 'Desplegar todo'}>
          <IconButton onClick={() => {
            if (allExpanded) {
              setExpanded([]);
              setAllExpanded(false);
            } else {
              setExpanded(nodes.map(n => String(n.id)));
              setAllExpanded(true);
            }
          }}>
            {allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Filtros">
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        {showFilters && (
          <div style={{ margin: '1rem 0' }}>
            <TextField label="Buscar" value={filter} onChange={e => setFilter(e.target.value)} sx={{ mr: 1 }} />
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel>Etiquetas</InputLabel>
              <Select
                multiple
                label="Etiquetas"
                value={filterTags}
                onChange={e => setFilterTags(e.target.value)}
                renderValue={selected => (
                  <div>
                    {selected.map(id => {
                      const tag = tags.find(t => t.id === id);
                      return (
                        <span
                          key={id}
                          style={{ backgroundColor: tag.bgColor, color: tag.textColor, padding: '0 0.25rem', marginRight: '0.25rem', borderRadius: '4px' }}
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
                    <span style={{ backgroundColor: tag.bgColor, color: tag.textColor, padding: '0 0.25rem', borderRadius: '4px' }}>{tag.name}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Reset">
              <IconButton onClick={() => { setFilter(''); setFilterTags([]); }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
        <TreeView
          slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
          expandedItems={expanded}
          onExpandedItemsChange={(e, ids) => {
            setExpanded(ids);
            setAllExpanded(ids.length === nodes.length);
          }}
          selectedItems={selected}
          onSelectedItemsChange={(e, ids) => setSelected(ids)}
        >
          {renderTree(null)}
        </TreeView>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} nodo</DialogTitle>
          <DialogContent>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Datos del nodo" />
              <Tab label="RASCI" />
              <Tab label="Adjuntos" />
            </Tabs>
            {tab === 0 && (
            <div>
            <Autocomplete
              fullWidth
              options={[{ id: '', code: '', name: 'Ninguno', isNone: true },
                ...sortedNodes.filter(n => !editing || n.id !== editing.id)]}
              getOptionLabel={opt => opt.isNone ? opt.name : `[${opt.code}] ${opt.name}`}
              filterOptions={(options, state) =>
                options.filter(o =>
                  o.isNone ||
                  o.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                  o.code.toLowerCase().includes(state.inputValue.toLowerCase())
                )
              }
              renderOption={(props, option) => option.isNone ? (
                <li {...props}><em>{option.name}</em></li>
              ) : (
                <li {...props}><strong>[{option.code}]</strong> {option.name}</li>
              )}
              value={sortedNodes.find(n => n.id === form.parentId) || null}
              onChange={(e, val) => setForm({ ...form, parentId: val ? val.id : '' })}
              renderInput={(params) => <TextField {...params} label="Nodo padre" />}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Código"
              value={form.code}
              inputProps={{ readOnly: true, style: { userSelect: 'none' } }}
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              required
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              sx={{ mt: 2 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Patrón de código</InputLabel>
              <Select
                label="Patrón de código"
                value={form.patternType}
                onChange={e => setForm({ ...form, patternType: e.target.value })}
              >
                <MenuItem value="order">Por orden</MenuItem>
                <MenuItem value="text">Texto</MenuItem>
              </Select>
            </FormControl>
            {form.patternType === 'text' && (
              <TextField
                required
                label="Texto"
                value={form.patternText}
                inputProps={{ maxLength: 5 }}
                onChange={e => setForm({ ...form, patternText: e.target.value.toUpperCase() })}
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Etiquetas</InputLabel>
              <Select
                multiple
                label="Etiquetas"
                value={selectedTags}
                onChange={e => {
                  const val = e.target.value;
                  const combined = Array.from(new Set([...val, ...inheritedTags]));
                  setSelectedTags(combined);
                }}
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
                  <MenuItem key={tag.id} value={tag.id} disabled={inheritedTags.includes(tag.id)}>
                    <span style={{ backgroundColor: tag.bgColor, color: tag.textColor, padding: '0 0.25rem', borderRadius: '4px' }}>
                      {tag.name}
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </div>) }
            {tab === 1 && (
            <div>
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
            </div>)}
            {tab === 2 && editing && (
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
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveNode} disabled={saving}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

