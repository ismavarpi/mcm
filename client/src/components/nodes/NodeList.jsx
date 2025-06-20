import React from 'react';
import axios from 'axios';
import useProcessingAction from '../../hooks/useProcessingAction';
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
import TouchAppIcon from '@mui/icons-material/TouchApp';
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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { jsPDF } from 'jspdf';
import { SimpleTreeView as TreeView } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Autocomplete from '@mui/material/Autocomplete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import { Editor as DraftEditor, EditorState, convertToRaw, ContentState, RichUtils, AtomicBlockUtils } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
const NodeDetails = React.lazy(() => import('./NodeDetails'));

const rasciStyles = {
  R: { bg: '#ffcc80', border: '#ffa726' },
  A: { bg: '#ef9a9a', border: '#e57373' },
  S: { bg: '#fff59d', border: '#fff176' },
  C: { bg: '#c8e6c9', border: '#a5d6a7' },
  I: { bg: '#bbdefb', border: '#90caf9' }
};

// Renderizador para bloques de imagen en el editor WYSIWYG
function ImageBlock(props) {
  const entity = props.contentState.getEntity(props.block.getEntityAt(0));
  if (entity.getType() !== 'IMAGE') return null;
  const { src, width, height, alt } = entity.getData();
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ maxWidth: '100%' }}
    />
  );
}

function blockRenderer(block) {
  if (block.getType() === 'atomic') {
    return {
      component: ImageBlock,
      editable: false
    };
  }
  return null;
}

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
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ parentId: '', code: '', name: '', patternType: 'order', patternText: '', description: '', bold: false, underline: false });
  const [showFilters, setShowFilters] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [filterTags, setFilterTags] = React.useState([]);
  const [filterTeam, setFilterTeam] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('');
  const [filterResp, setFilterResp] = React.useState('');
  const [teams, setTeams] = React.useState([]);
  const [roles, setRoles] = React.useState({});
  const [rasciLines, setRasciLines] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [attachments, setAttachments] = React.useState([]);
  const [viewNode, setViewNode] = React.useState(null);
  const [viewAttachments, setViewAttachments] = React.useState([]);
  const attachmentCache = React.useRef({});
  const rasciCache = React.useRef({});
  const [viewPath, setViewPath] = React.useState([]);
  const [attForm, setAttForm] = React.useState({ categoryId: '', name: '', file: null });
  const [addAttachment, addingAttachment] = useProcessingAction(async () => {
    if (!attForm.file) return;
    const fd = new FormData();
    fd.append('file', attForm.file);
    fd.append('name', attForm.name);
    fd.append('categoryId', attForm.categoryId);
    await axios.post(`/api/nodes/${editing.id}/attachments`, fd);
    setAttForm({ categoryId: '', name: '', file: null });
    if (attachmentCache.current[editing.id]) delete attachmentCache.current[editing.id];
    loadAttachments(editing.id);
  });
  const [removeAttachment, removingAttachment] = useProcessingAction(async (id) => {
    await axios.delete(`/api/nodes/attachments/${id}`);
    if (attachmentCache.current[editing.id]) delete attachmentCache.current[editing.id];
    loadAttachments(editing.id);
  });
  const [downloadAttachment] = useProcessingAction(async (uuid, name) => {
    const res = await axios.get(`/api/nodes/attachments/download/${uuid}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const disposition = res.headers['content-disposition'] || '';
    let filename = name;
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, '');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState('');
  const [focusNodeId, setFocusNodeId] = React.useState(null);
  const [allExpanded, setAllExpanded] = React.useState(false);
  const [inheritedTags, setInheritedTags] = React.useState([]);
  const [tab, setTab] = React.useState(0);
  const [editorState, setEditorState] = React.useState(() => EditorState.createEmpty());
  const [detailsOpen, setDetailsOpen] = React.useState(true);
  const [leftWidth, setLeftWidth] = React.useState(40); // percentage
  const containerRef = React.useRef(null);
  const resizing = React.useRef(false);
  const fileInputRef = React.useRef(null);
  const [editingLeaf, setEditingLeaf] = React.useState(true);
  const handleKeyCommand = (command, state) => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = style => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = type => {
    setEditorState(RichUtils.toggleBlockType(editorState, type));
  };

  const insertImage = async file => {
    if (!file) return;
    const width = prompt('Anchura en px', '300');
    const height = prompt('Altura en px', '200');
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post('/api/images', fd);
    const url = res.data.url;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src: url, width, height, alt: '' });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    setEditorState(EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter()));
  };

  const handleTeamFilter = (teamId) => {
    setShowFilters(true);
    setFilterTeam(teamId);
    setFilterRole('');
    setFilterResp('');
  };

  const handleRoleFilter = (teamId, roleId) => {
    setShowFilters(true);
    setFilterTeam(teamId);
    setFilterRole(roleId);
    setFilterResp('');
  };

  const handleRespFilter = (teamId, roleId, resp) => {
    setShowFilters(true);
    setFilterTeam(teamId);
    setFilterRole(roleId);
    setFilterResp(resp);
  };

  const handlePathClick = (id) => {
    setFocusNodeId(id);
  };

  React.useEffect(() => {
    const handleMove = (e) => {
      if (!resizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newLeft = ((e.clientX - rect.left) / rect.width) * 100;
      if (newLeft < 10) newLeft = 10;
      if (newLeft > 90) newLeft = 90;
      setLeftWidth(newLeft);
    };
    const stopResize = () => { resizing.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  React.useEffect(() => {
    if (dialogOpen) {
      const blocks = htmlToDraft(form.description || '');
      const contentState = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [dialogOpen]);

  const rasciByTeam = React.useMemo(() => {
    const map = {};
    rasciLines.forEach((line, idx) => {
      const team = teams.find(t => t.id === line.teamId);
      if (!team) return;
      if (!map[team.id]) map[team.id] = { team, lines: [] };
      map[team.id].lines.push({ ...line, idx });
    });
    const arr = Object.values(map);
    arr.sort((a, b) => a.team.order - b.team.order);
    arr.forEach(group => {
      group.lines.sort((a, b) => {
        const ra = roles[group.team.id]?.find(r => r.id === a.roleId) || { order: 0 };
        const rb = roles[group.team.id]?.find(r => r.id === b.roleId) || { order: 0 };
        return ra.order - rb.order;
      });
    });
    return arr;
  }, [rasciLines, teams, roles]);

  const completeRasciLines = React.useCallback((lines) => {
    const all = [...lines];
    teams.forEach(t => {
      (roles[t.id] || []).forEach(r => {
        if (!all.some(l => l.roleId === r.id)) {
          all.push({ teamId: t.id, roleId: r.id, responsibilities: [] });
        }
      });
    });
    all.sort((a, b) => {
      const ta = teams.find(t => t.id === a.teamId) || { order: 0 };
      const tb = teams.find(t => t.id === b.teamId) || { order: 0 };
      if (ta.order !== tb.order) return ta.order - tb.order;
      const ra = roles[ta.id]?.find(r => r.id === a.roleId) || { order: 0 };
      const rb = roles[tb.id]?.find(r => r.id === b.roleId) || { order: 0 };
      return ra.order - rb.order;
    });
    return all;
  }, [teams, roles]);



  const toggleResp = (idx, ch) => {
    setRasciLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      const selected = line.responsibilities.includes(ch);
      return {
        ...line,
        responsibilities: selected
          ? line.responsibilities.filter(c => c !== ch)
          : [...line.responsibilities, ch]
      };
    }));
  };

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
    setLoading(true);
    const [nodesRes, tagsRes, teamsRes, rolesRes] = await Promise.all([
      axios.get(`/api/models/${modelId}/nodes/tree`),
      axios.get(`/api/models/${modelId}/tags`),
      axios.get(`/api/models/${modelId}/teams`),
      axios.get(`/api/models/${modelId}/roles`)
    ]);
    const rolesMap = {};
    rolesRes.data.forEach(group => { rolesMap[group.teamId] = group.roles; });
    setTeams(teamsRes.data);
    setRoles(rolesMap);
    setNodes(nodesRes.data);
    setExpanded(nodesRes.data.map(n => String(n.id)));
    setTags(tagsRes.data);
    setLoading(false);
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
      axios.get(`/api/nodes/${focusNodeId}`)
        .then(res => setViewNode(res.data))
        .catch(() => setViewNode(null));
      setFocusNodeId(null);
    }
  }, [focusNodeId, nodes]);

  const loadCategories = async () => {
    const res = await axios.get(`/api/models/${modelId}/categoria-documentos`);
    setCategories(res.data);
  };

  const loadAttachments = async (id) => {
    if (attachmentCache.current[id]) {
      setAttachments(attachmentCache.current[id]);
      return;
    }
    const res = await axios.get(`/api/nodes/${id}/attachments`);
    attachmentCache.current[id] = res.data;
    setAttachments(res.data);
  };

  const loadViewAttachments = async (id) => {
    if (attachmentCache.current[id]) {
      setViewAttachments(attachmentCache.current[id]);
      return;
    }
    const res = await axios.get(`/api/nodes/${id}/attachments`);
    attachmentCache.current[id] = res.data;
    setViewAttachments(res.data);
  };

  React.useEffect(() => {
    if (viewNode) {
      loadViewAttachments(viewNode.id);
    } else {
      setViewAttachments([]);
    }
  }, [viewNode]);

  React.useEffect(() => {
    if (viewNode) {
      const map = Object.fromEntries(nodes.map(n => [n.id, n]));
      let current = viewNode;
      const path = [];
      while (current) {
        path.unshift({ id: current.id, code: current.code, name: current.name });
        current = current.parentId ? map[current.parentId] : null;
      }
      setViewPath(path);
    } else {
      setViewPath([]);
    }
  }, [viewNode, nodes]);

  React.useEffect(() => { if (open) { load(); loadCategories(); } }, [open]);

  const [saveNode, saving] = useProcessingAction(async () => {
    const countA = rasciLines.filter(l => l.responsibilities.includes('A')).length;
    const countR = rasciLines.filter(l => l.responsibilities.includes('R')).length;
    const anySelected = rasciLines.some(l => l.responsibilities.length > 0);
    if (anySelected && (countA === 0 || countR === 0)) {
      alert('Debe existir al menos un rol con responsabilidad A y otro con responsabilidad R');
      return;
    }
    if (anySelected && (countA > 1 || countR > 1)) {
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
      description: form.description,
      bold: form.bold,
      underline: form.underline,
      tagIds: selectedTags,
      rasci: rasciLines.map(l => ({ roleId: l.roleId, responsibilities: l.responsibilities }))
    };
    let res;
    if (editing) {
      res = await axios.put(`/api/nodes/${editing.id}`, payload);
    } else {
      res = await axios.post(`/api/models/${modelId}/nodes`, payload);
    }
    setDialogOpen(false);
    setForm({ parentId: '', code: '', name: '', patternType: 'order', patternText: '', description: '', bold: false, underline: false });
    setSelectedTags([]);
    setRasciLines([]);
    setEditing(null);
    await load();
    setFocusNodeId(res.data.id);
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
    await load();
    setFocusNodeId(id);
  });

  const openEdit = async (node) => {
    const res = await axios.get(`/api/nodes/${node.id}`);
    const fullNode = res.data;
    setEditing(fullNode);
    setEditingLeaf(!nodes.some(n => n.parentId === node.id));
    setForm({
      parentId: fullNode.parentId || '',
      code: fullNode.code,
      name: fullNode.name,
      patternType: fullNode.codePattern === 'ORDER' ? 'order' : 'text',
      patternText: fullNode.codePattern === 'ORDER' ? '' : fullNode.codePattern,
      description: fullNode.description || '',
      bold: !!fullNode.bold,
      underline: !!fullNode.underline
    });
    const parent = nodes.find(n => n.id === fullNode.parentId);
    const inherited = parent && parent.tags ? parent.tags.map(t => t.id) : [];
    setInheritedTags(inherited);
    const nodeTagIds = fullNode.tags ? fullNode.tags.map(t => t.id) : [];
    setSelectedTags(Array.from(new Set([...nodeTagIds, ...inherited])));
    let rasciData = rasciCache.current[fullNode.id];
    if (!rasciData) {
      const rasciRes = await axios.get(`/api/nodes/${fullNode.id}/rascis`);
      rasciData = rasciRes.data;
      rasciCache.current[fullNode.id] = rasciData;
    }
    const sorted = rasciData.sort((a,b)=>{
      const ta = teams.find(t=>t.id===a.Role.teamId)||{order:0};
      const tb = teams.find(t=>t.id===b.Role.teamId)||{order:0};
      if(ta.order!==tb.order) return ta.order-tb.order;
      const ra = roles[ta.id]?.find(r=>r.id===a.roleId)||{order:0};
      const rb = roles[tb.id]?.find(r=>r.id===b.roleId)||{order:0};
      return ra.order-rb.order;
    });
    setRasciLines(completeRasciLines(sorted.map(r=>({id:r.id, teamId:r.Role.teamId, roleId:r.roleId, responsibilities:r.responsibilities.split('')}))));
    loadAttachments(fullNode.id);
    setTab(0);
    setDialogOpen(true);
  };

  const openCreate = async (parentId = '') => {
    setEditing(null);
    setEditingLeaf(true);
    setForm({ parentId, code: '', name: '', patternType: 'order', patternText: '', description: '', bold: false, underline: false });
    const parent = nodes.find(n => n.id === parentId);
    const inherited = parent && parent.tags ? parent.tags.map(t => t.id) : [];
    setInheritedTags(inherited);
    setSelectedTags(inherited);
    if (parentId) {
      let rasciData = rasciCache.current[parentId];
      if (!rasciData) {
        const rasciRes = await axios.get(`/api/nodes/${parentId}/rascis`);
        rasciData = rasciRes.data;
        rasciCache.current[parentId] = rasciData;
      }
      const sorted = rasciData.sort((a,b)=>{
        const ta = teams.find(t=>t.id===a.Role.teamId)||{order:0};
        const tb = teams.find(t=>t.id===b.Role.teamId)||{order:0};
        if(ta.order!==tb.order) return ta.order-tb.order;
        const ra = roles[ta.id]?.find(r=>r.id===a.roleId)||{order:0};
        const rb = roles[tb.id]?.find(r=>r.id===b.roleId)||{order:0};
        return ra.order-rb.order;
      });
      setRasciLines(completeRasciLines(sorted.map(r=>({teamId:r.Role.teamId, roleId:r.roleId, responsibilities:r.responsibilities.split('')}))));
    } else {
      setRasciLines(completeRasciLines([]));
    }
    setAttachments([]);
    setAttForm({ categoryId: '', name: '', file: null });
    setTab(0);
    setDialogOpen(true);
  };

  const visibleIds = React.useMemo(() => {
    const map = Object.fromEntries(nodes.map(n => [n.id, n]));
    const parentIds = new Set(nodes.map(n => n.parentId).filter(id => id));
    const ids = new Set();
    const rasciFiltering = !!(filterTeam || filterRole || filterResp);
    if (!filter && filterTags.length === 0 && !rasciFiltering) {
      nodes.forEach(n => ids.add(n.id));
      return ids;
    }
    nodes.forEach(n => {
      const isLeaf = !parentIds.has(n.id);
      const matchesText = !filter || n.name.toLowerCase().includes(filter.toLowerCase());
      const matchesTags = filterTags.length === 0 || (n.tags && filterTags.every(tagId => n.tags.some(t => t.id === tagId)));
      const matchesRasci = !rasciFiltering || (
        isLeaf && n.rascis && n.rascis.some(r => {
          const teamOk = !filterTeam || r.Role.teamId === filterTeam;
          const roleOk = !filterRole || r.roleId === filterRole;
          const respOk = !filterResp || r.responsibilities.includes(filterResp);
          const hasResp = (filterTeam || filterRole)
            ? r.responsibilities && r.responsibilities.length > 0
            : true;
          return teamOk && roleOk && respOk && hasResp;
        })
      );
      if (matchesText && matchesTags && matchesRasci) {
        let current = n;
        while (current) {
          ids.add(current.id);
          current = current.parentId ? map[current.parentId] : null;
        }
      }
    });
    return ids;
  }, [nodes, filter, filterTags, filterTeam, filterRole, filterResp]);

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
              <span
                style={{
                  marginRight: '0.5rem',
                  fontWeight: n.bold ? 'bold' : 'normal',
                  textDecoration: n.underline ? 'underline' : 'none'
                }}
              >
                {n.name}
              </span>

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
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(n.id)}
                      disabled={(n.name === 'Raiz' && n.parentId === null) || removing}
                      sx={{ ml: 0.5 }}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </span>
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
    <div style={{ position: 'fixed', top: '64px', left: 0, width: '100%', height: 'calc(100% - 64px)', backgroundColor: '#fff', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={onClose}>
          Volver a modelos
        </Button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Nodos del modelo</div>
          <div style={{ fontSize: '1rem', color: '#666' }}>{modelName}</div>
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: detailsOpen ? `${leftWidth}%` : '100%', minWidth: 300, padding: '1rem', overflowY: 'auto', borderRight: detailsOpen ? '1px solid #ccc' : 'none', transition: 'width 0.3s' }}>
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
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel>Equipo</InputLabel>
              <Select
                label="Equipo"
                value={filterTeam}
                onChange={e => { setFilterTeam(e.target.value); setFilterRole(''); }}
              >
                <MenuItem value="">Todos</MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                label="Rol"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                disabled={!filterTeam}
              >
                <MenuItem value="">Todos</MenuItem>
                {(roles[filterTeam] || []).map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ mr: 1, minWidth: 80 }}>
              <InputLabel>Resp.</InputLabel>
              <Select
                label="Resp."
                value={filterResp}
                onChange={e => setFilterResp(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {['R','A','S','C','I'].map(ch => (
                  <MenuItem key={ch} value={ch}>{ch}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Reset">
              <IconButton onClick={() => { setFilter(''); setFilterTags([]); setFilterTeam(''); setFilterRole(''); setFilterResp(''); }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} variant="text" height={30} sx={{ mb: 0.5 }} />
            ))}
          </div>
        ) : (
          <TreeView
            slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
            expandedItems={expanded}
            onExpandedItemsChange={(e, ids) => {
              setExpanded(ids);
              setAllExpanded(ids.length === nodes.length);
            }}
            selectedItems={selected}
            onSelectedItemsChange={async (e, ids) => {
              const idStr = Array.isArray(ids) ? ids[0] : ids;
              setSelected(idStr);
              const id = parseInt(idStr, 10);
              try {
                const res = await axios.get(`/api/nodes/${id}`);
                setViewNode(res.data);
                if (!detailsOpen) setDetailsOpen(true);
              } catch {
                setViewNode(null);
              }
            }}
            expansionTrigger="iconContainer"
          >
            {renderTree(null)}
          </TreeView>
        )}
        </div>
        {detailsOpen && (
          <div
            style={{ width: '5px', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }}
            onMouseDown={() => { resizing.current = true; }}
          >
            <DragIndicatorIcon fontSize="small" />
          </div>
        )}
        {detailsOpen ? (
          <div style={{ width: `${100 - leftWidth}%`, padding: '1rem', overflowY: 'auto', transition: 'width 0.3s' }}>
            <React.Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
              <NodeDetails
                node={viewNode}
                attachments={viewAttachments}
                path={viewPath}
                onPathClick={handlePathClick}
                isLeaf={viewNode ? !nodes.some(n => n.parentId === viewNode.id) : true}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTagClick={(id) => { setShowFilters(true); setFilterTags([id]); }}
                onTeamClick={handleTeamFilter}
                onRoleClick={handleRoleFilter}
                onRespClick={handleRespFilter}
                onClose={() => setDetailsOpen(false)}
              />
            </React.Suspense>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton size="small" onClick={() => setDetailsOpen(true)}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} nodo</DialogTitle>
          <DialogContent sx={{ minHeight: 600, display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Datos del nodo" />
              <Tab label="Descripción" />
              {editingLeaf && <Tab label="RASCI" />}
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '16px' }}>
              <FormControl sx={{ flex: 1 }}>
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
                  sx={{ width: '10rem' }}
                />
              )}
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <FormControlLabel
                control={<Checkbox checked={form.bold} onChange={e => setForm({ ...form, bold: e.target.checked })} />}
                label="Nombre en negrita"
              />
              <FormControlLabel
                control={<Checkbox checked={form.underline} onChange={e => setForm({ ...form, underline: e.target.checked })} />}
                label="Nombre subrayado"
              />
            </div>
            </div>) }
            {tab === 1 && (
            <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <Tooltip title="Negrita">
                  <IconButton size="small" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('BOLD'); }}>
                    <FormatBoldIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cursiva">
                  <IconButton size="small" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('ITALIC'); }}>
                    <FormatItalicIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Subrayado">
                  <IconButton size="small" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('UNDERLINE'); }}>
                    <FormatUnderlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Lista">
                  <IconButton size="small" onMouseDown={e => { e.preventDefault(); toggleBlockType('unordered-list-item'); }}>
                    <FormatListBulletedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Lista numerada">
                  <IconButton size="small" onMouseDown={e => { e.preventDefault(); toggleBlockType('ordered-list-item'); }}>
                    <FormatListNumberedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Imagen">
                  <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
                    <AddPhotoAlternateIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={e => { insertImage(e.target.files[0]); e.target.value = null; }}
                />
              </div>
              <div style={{ border: '1px solid #ccc', flex: 1, padding: '0.5rem', overflow: 'auto' }}>
                <DraftEditor
                  editorState={editorState}
                  onChange={state => {
                    setEditorState(state);
                    setForm({ ...form, description: draftToHtml(convertToRaw(state.getCurrentContent())) });
                  }}
                  handleKeyCommand={handleKeyCommand}
                  blockRendererFn={blockRenderer}
                />
              </div>
            </div>
            ) }
            {editingLeaf && tab === 2 && (
            <div>
              {rasciByTeam.map(group => (
                <Card key={group.team.id} sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{group.team.order} - {group.team.name}</Typography>
                    {group.lines.map(line => (
                      <div key={line.idx} style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ flex: 1 }}>{roles[group.team.id]?.find(r => r.id === line.roleId)?.name || ''}</span>
                        {['R','A','S','C','I'].map(ch => (
                          <span
                            key={ch}
                            style={{
                              marginRight: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: line.responsibilities.includes(ch) ? rasciStyles[ch].bg : 'transparent',
                              color: line.responsibilities.includes(ch) ? 'black' : '#ccc',
                              borderRadius: 4,
                              border: line.responsibilities.includes(ch) ? `1px solid ${rasciStyles[ch].border}` : '1px solid transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => toggleResp(line.idx, ch)}
                          >
                            {ch}
                          </span>
                        ))}
                        <TouchAppIcon fontSize="inherit" sx={{ ml: 0.5, color: '#888' }} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>)}
            {((editingLeaf && tab === 3) || (!editingLeaf && tab === 2)) && (
            <> 
              {editing ? (
              <>
              <div style={{ marginTop: '1rem' }}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell style={{ fontWeight: 'bold' }}>Categoría</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attachments.map(att => (
                        <TableRow key={att.id}>
                          <TableCell>{att.CategoriaDocumento.name}</TableCell>
                          <TableCell>{att.name}</TableCell>
                          <TableCell>
                            <Tooltip title="Descargar" sx={{ mr: 1 }}>
                              <span>
                                <IconButton size="small" onClick={() => downloadAttachment(att.uuid, att.name)}>
                                  <FileDownloadIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Eliminar archivo">
                              <span>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    if (window.confirm('¿Eliminar archivo?')) removeAttachment(att.id);
                                  }}
                                  disabled={removingAttachment}
                                >
                                  <DeleteIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
              <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
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
                  required
                  onChange={e => setAttForm({ ...attForm, file: e.target.files[0] })}
                  style={{ marginTop: '1rem' }}
                />
                <Button onClick={addAttachment} disabled={addingAttachment} sx={{ mt: 1 }}>
                  Añadir
                </Button>
              </div>
              </>
              ) : (
                <Typography sx={{ mt: 2 }}>
                  Guarde el nodo para poder añadir adjuntos.
                </Typography>
              )}
            </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveNode} disabled={saving}>Guardar</Button>
          </DialogActions>
        </Dialog>
    </div>
  );
}

