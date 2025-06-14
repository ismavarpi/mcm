import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function NodeDetails({ node, attachments, onEdit, onDelete, onExport }) {
  if (!node) {
    return <div>Selecciona un nodo</div>;
  }

  const contentRef = React.useRef(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <Tooltip title="Editar nodo">
          <span>
            <IconButton size="small" onClick={onEdit} disabled={!onEdit}>
              <EditIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Eliminar nodo">
          <span>
            <IconButton size="small" color="error" onClick={onDelete} disabled={!onDelete} sx={{ ml: 0.5 }}>
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Exportar PDF">
          <span>
            <IconButton size="small" onClick={() => onExport && onExport(contentRef.current)} sx={{ ml: 0.5 }}>
              <PictureAsPdfIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
      <div ref={contentRef} id="node-details-content">
      <h2>[{node.code}] {node.name}</h2>
      {node.tags && node.tags.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {node.tags.map(tag => (
            <span
              key={tag.id}
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
          ))}
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: node.description }} />
      {node.rascis && node.rascis.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>RASCI</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                <th style={{ textAlign: 'left' }}>Rol</th>
                <th style={{ textAlign: 'left' }}>Responsabilidades</th>
              </tr>
            </thead>
            <tbody>
              {node.rascis.map(r => (
                <tr key={r.id}>
                  <td>{r.Role.Team.name}</td>
                  <td>{r.Role.name}</td>
                  <td>{r.responsibilities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {attachments && attachments.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Adjuntos</h3>
          <ul>
            {attachments.map(att => (
              <li key={att.id}>
                <a href={`/${att.filePath}`} download>{att.name}</a>{' '}
                (<span>{att.CategoriaDocumento.name}</span>)
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}
