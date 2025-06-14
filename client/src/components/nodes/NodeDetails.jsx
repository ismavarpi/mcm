import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export default function NodeDetails({ node, attachments }) {
  if (!node) {
    return <div>Selecciona un nodo</div>;
  }

  const rasciByTeam = React.useMemo(() => {
    if (!node.rascis) return [];
    const map = {};
    node.rascis.forEach(r => {
      const team = r.Role.Team;
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
      {rasciByTeam.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>RASCI</h3>
          {rasciByTeam.map(group => (
            <Card key={group.team.id} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6">{group.team.order} - {group.team.name}</Typography>
                {group.lines.map(line => (
                  <div key={line.id} style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ flex: 1 }}>{line.Role.name}</span>
                    {['R','A','S','C','I'].map(ch => (
                      <span
                        key={ch}
                        style={{
                          marginRight: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: line.responsibilities.includes(ch) ? '#c8e6c9' : 'transparent',
                          color: line.responsibilities.includes(ch) ? 'black' : '#ccc',
                          borderRadius: 4,
                          border: line.responsibilities.includes(ch) ? '1px solid #a5d6a7' : '1px solid transparent'
                        }}
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
                <a href={`/${att.filePath}`} download>{att.name}</a>{' '}
                (<span>{att.CategoriaDocumento.name}</span>)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
