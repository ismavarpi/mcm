const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const he = require('he');

async function parseFile(inputPath) {
  const xml = fs.readFileSync(inputPath, 'utf8');
  const data = await xml2js.parseStringPromise(xml, { trim: true });
  return data.Actividades.Actividad || [];
}

function decode(value) {
  if (!value) return '';
  if (Array.isArray(value)) value = value[0];
  return he.decode(String(value).trim());
}

function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9]/g, '');
}

function initCounters() {
  return `-- Initialize counters\n` +
    `SET @model_id := (SELECT COALESCE(MAX(id),0) FROM \`Models\`);\n` +
    `SET @team_id := (SELECT COALESCE(MAX(id),0) FROM \`Teams\`);\n` +
    `SET @role_id := (SELECT COALESCE(MAX(id),0) FROM \`Roles\`);\n` +
    `SET @node_id := (SELECT COALESCE(MAX(id),0) FROM \`Nodes\`);\n` +
    `SET @rasci_id := (SELECT COALESCE(MAX(id),0) FROM \`NodeRascis\`);\n\n`;
}

function buildInserts(entity, rows, counter) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]).filter(c => !['id','var','teamVar','parentVar','modelVar'].includes(c));
  const colList = cols.map(c => `\`${c}\``).join(', ');
  let sql = `-- ${entity}\n`;
  for (const row of rows) {
    sql += `SET @${counter} := @${counter} + 1;\n`;
    if (row.var) sql += `SET @${row.var} := @${counter};\n`;
    const vals = cols.map(c => {
      if (c === 'teamId' && row.teamVar) return `@${row.teamVar}`;
      if (c === 'parentId' && row.parentVar) return `@${row.parentVar}`;
      if (c === 'modelId' && row.modelVar) return `@${row.modelVar}`;
      return row[c] === null ? 'NULL' : JSON.stringify(row[c]);
    }).join(', ');
    sql += `INSERT INTO \`${entity}\` (id, ${colList}) VALUES (@${counter}, ${vals});\n`;
  }
  sql += '\n';
  return sql;
}

function buildRascis(rows) {
  if (!rows.length) return '';
  let sql = `-- NodeRascis\n`;
  for (const row of rows) {
    sql += `SET @rasci_id := @rasci_id + 1;\n`;
    sql += `INSERT INTO \`NodeRascis\` (id, nodeId, roleId, responsibilities) VALUES (@rasci_id, @${row.nodeVar}, @${row.roleVar}, ${row.responsibilities ? JSON.stringify(row.responsibilities) : 'NULL'});\n`;
  }
  sql += '\n';
  return sql;
}

async function main() {
  const input = process.argv[2] || path.join(__dirname, '..', '..', 'import', 'actividades.BACKUP MCMI.xml');
  const output = process.argv[3] || path.join(__dirname, '..', '..', 'export', 'import.sql');
  const actividades = await parseFile(input);

  const teams = new Map();
  const roles = new Map();
  const nodes = new Map();
  const rascis = [];

  let teamId = 1;
  let roleId = 1;
  let nodeId = 1;
  const orderCounters = new Map();

  function ensureNode(pathArr, name, desc) {
    const key = pathArr.join('-');
    if (!nodes.has(key)) {
      const parentKey = pathArr.slice(0, -1).join('-');
      const parent = nodes.get(parentKey);
      const order = (orderCounters.get(parentKey) || 0) + 1;
      orderCounters.set(parentKey, order);
      const code = parent ? `${parent.code}.${order}` : String(order);
      const id = nodeId++;
      const node = {
        id,
        var: `n${id}`,
        name,
        description: desc,
        order,
        codePattern: 'ORDER',
        code,
        bold: false,
        underline: false,
        modelId: null,
        modelVar: 'model_import',
        parentId: parent ? parent.id : null,
        parentVar: parent ? parent.var : null,
      };
      nodes.set(key, node);
    }
    return nodes.get(key);
  }

  for (const act of actividades) {
    const name = decode(act.Nombre_Tarea);
    const edt = decode(act.EDT);
    const desc = decode(act.Notas);
    const pathArr = edt.split('-').filter(Boolean);
    if (!pathArr.length) continue;
    const node = ensureNode(pathArr, name, desc);
    const rasciList = (act.MatrizRASCI && act.MatrizRASCI[0].rasci) || [];
    for (const r of rasciList) {
      const rolText = decode(r.rol);
      const resp = decode(r.responsabilidad);
      if (!rolText) continue;
      const [teamName, roleName] = rolText.split('_');
      if (!teamName || !roleName) continue;
      let team = teams.get(teamName);
      if (!team) {
        const id = teamId++;
        team = { id, var: `t_${sanitize(teamName)}`, name: teamName, order: teams.size + 1, modelId: null, modelVar: 'model_import' };
        teams.set(teamName, team);
      }
      const roleKey = `${teamName}_${roleName}`;
      let role = roles.get(roleKey);
      if (!role) {
        const count = Array.from(roles.values()).filter(ro => ro.teamId === team.id).length;
        const id = roleId++;
        role = { id, var: `r_${sanitize(teamName)}_${sanitize(roleName)}`, name: roleName, order: count + 1, teamId: null, teamVar: team.var };
        roles.set(roleKey, role);
      }
      rascis.push({ nodeVar: node.var, roleVar: role.var, responsibilities: resp });
    }
  }

  const model = { id: 1, var: 'model_import', name: 'Modelo importado', author: 'import', parentId: null };

  let sql = '';
  sql += initCounters();
  sql += buildInserts('Models', [model], 'model_id');
  sql += buildInserts('Teams', Array.from(teams.values()), 'team_id');
  sql += buildInserts('Roles', Array.from(roles.values()), 'role_id');
  sql += buildInserts('Nodes', Array.from(nodes.values()), 'node_id');
  sql += buildRascis(rascis);

  fs.writeFileSync(output, sql);
  console.log('SQL generated at', output);
}

main().catch(err => { console.error(err); process.exit(1); });
