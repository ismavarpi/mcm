import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HomeIcon from '@mui/icons-material/Home';
import { jsPDF } from 'jspdf';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const rasciStyles = {
  R: { bg: '#ffcc80', border: '#ffa726' },
  A: { bg: '#ef9a9a', border: '#e57373' },
  S: { bg: '#fff59d', border: '#fff176' },
  C: { bg: '#c8e6c9', border: '#a5d6a7' },
  I: { bg: '#bbdefb', border: '#90caf9' }
};

export default function NodeDetails({ node, attachments, path = [], onEdit, onDelete, onTagClick, onClose, onTeamClick, onRoleClick, onRespClick, onPathClick, isLeaf }) {
  if (!node) {
    return <div>Selecciona un nodo</div>;
  }

  const contentRef = React.useRef(null);

  const exportPdf = () => {
    if (!contentRef.current) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.html(contentRef.current, {
      callback: () => doc.save(`${node.code}.pdf`),
      html2canvas: { scale: 0.8 }
    });
  };

  const downloadAttachment = async (uuid, name) => {
    const res = await fetch(`/api/nodes/attachments/download/${uuid}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const disposition = res.headers.get('content-disposition') || '';
    let filename = name;
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, '');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const rasciByTeam = React.useMemo(() => {
    if (!node.rascis) return [];
    const map = {};
    node.rascis.forEach(r => {
      const team = r.Role?.Team;
      if (!team) return;
      if (!map[team.id]) map[team.id] = { team, lines: [] };
      map[team.id].lines.push(r);
    });
    const arr = Object.values(map);
    arr.sort((a, b) => a.team.order - b.team.order);
    arr.forEach(group => {
      group.lines.sort((a, b) => a.Role.order - b.Role.order);
    });
    return arr;
  }, [node.rascis]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>[{node.code}] {node.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {onEdit && (
            <Tooltip title="Editar nodo">
              <IconButton size="small" onClick={() => onEdit(node)}>
                <EditIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Borrar nodo">
              <IconButton size="small" color="error" onClick={() => onDelete(node.id)}>
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Exportar PDF">
            <IconButton size="small" onClick={exportPdf} sx={{ ml: 0.5 }}>
              <PictureAsPdfIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Ocultar detalles">
              <IconButton size="small" onClick={onClose} sx={{ ml: 0.5 }}>
                <ChevronRightIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
      {path.length > 0 && (
        <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />
          {path.map((p, idx) => (
            <React.Fragment key={p.id}>
              <span
                onClick={onPathClick ? () => onPathClick(p.id) : undefined}
                style={{ cursor: onPathClick ? 'pointer' : 'default' }}
              >
                [{p.code}] {p.name}
              </span>
              {idx < path.length - 1 && <span style={{ margin: '0 0.25rem' }}>{'>'}</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div ref={contentRef}>
      {node.tags && node.tags.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {node.tags.map(tag => (
            <span
              key={tag.id}
              onClick={onTagClick ? () => onTagClick(tag.id) : undefined}
              style={{
                backgroundColor: tag.bgColor,
                color: tag.textColor,
                padding: '0 0.25rem',
                marginRight: '0.25rem',
                borderRadius: '4px',
                cursor: onTagClick ? 'pointer' : 'default'
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: node.description }} />
      {isLeaf && rasciByTeam.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>RASCI</h3>
          {rasciByTeam.map(group => (
            <Card key={group.team.id} sx={{ mt: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  onClick={onTeamClick ? () => onTeamClick(group.team.id) : undefined}
                  sx={{ cursor: onTeamClick ? 'pointer' : 'default' }}
                >
                  {group.team.order} - {group.team.name}
                </Typography>
                {group.lines.map(line => (
                  <div key={line.id} style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span
                      style={{ flex: 1, cursor: onRoleClick ? 'pointer' : 'default' }}
                      onClick={onRoleClick ? () => onRoleClick(group.team.id, line.Role.id) : undefined}
                    >
                      {line.Role.name}
                    </span>
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
                          cursor: onRespClick ? 'pointer' : 'default'
                        }}
                        onClick={onRespClick ? () => onRespClick(group.team.id, line.Role.id, ch) : undefined}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {attachments && attachments.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Adjuntos</h3>
          <ul>
            {attachments.map(att => (
              <li key={att.id}>
                {att.name}{' '}
                (<span>{att.CategoriaDocumento.name}</span>)
                <IconButton size="small" onClick={() => downloadAttachment(att.uuid, att.name)} sx={{ ml: 1 }}>
                  <FileDownloadIcon fontSize="inherit" />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}
