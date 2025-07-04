const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const he = require('he');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../models');

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

function buildInserts(entity, rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]).filter(c => c !== 'id');
  const colList = cols.map(c => `\`${c}\``).join(', ');
  let sql = `-- Entity: ${entity}\n`;
  for (const row of rows) {
    const vals = cols.map(c => row[c] === null ? 'NULL' : JSON.stringify(row[c])).join(', ');
    sql += `INSERT INTO \`${entity}\` (id, ${colList}) VALUES (${row.id}, ${vals});\n`;

  }
  sql += '\n';
  return sql;
}

async function main() {
  const input = process.argv[2] || path.join(__dirname, '..', '..', 'import', 'actividades.BACKUP MCMI.xml');
  const output = process.argv[3] || path.join(__dirname, '..', '..', 'export', 'import.sql');
  const actividades = await parseFile(input);

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await db.sequelize.authenticate();
  const startModelId = (await db.Model.max('id')) || 0;
  const startTeamId = (await db.Team.max('id')) || 0;
  const startRoleId = (await db.Role.max('id')) || 0;
  const startNodeId = (await db.Node.max('id')) || 0;
  const startRasciId = (await db.NodeRasci.max('id')) || 0;


  const teams = new Map();
  const roles = new Map();
  const nodes = new Map();
  const rascis = [];

  let modelId = startModelId + 1;
  let teamId = startTeamId + 1;
  let roleId = startRoleId + 1;
  let nodeId = startNodeId + 1;
  let rasciId = startRasciId + 1;

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

        name,
        description: desc,
        order,
        codePattern: 'ORDER',
        code,
        bold: false,
        underline: false,
        modelId,
        parentId: parent ? parent.id : null,
        createdAt: timestamp,
        updatedAt: timestamp,

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
        team = { id, name: teamName, order: teams.size + 1, modelId, createdAt: timestamp, updatedAt: timestamp };
        teams.set(teamName, team);
      }
      const roleKey = `${teamName}_${roleName}`;
      let role = roles.get(roleKey);
      if (!role) {
        const count = Array.from(roles.values()).filter(ro => ro.teamId === team.id).length;
        const id = roleId++;
        role = { id, name: roleName, order: count + 1, teamId: team.id, createdAt: timestamp, updatedAt: timestamp };
        roles.set(roleKey, role);
      }
      rascis.push({ id: rasciId++, nodeId: node.id, roleId: role.id, responsibilities: resp || '', createdAt: timestamp, updatedAt: timestamp });
    }
  }

  const model = { id: modelId, name: 'Modelo importado', author: 'import', parentId: null, createdAt: timestamp, updatedAt: timestamp };

  let sql = '';
  sql += buildInserts('Models', [model]);
  sql += buildInserts('Teams', Array.from(teams.values()));
  sql += buildInserts('Roles', Array.from(roles.values()));
  sql += buildInserts('Nodes', Array.from(nodes.values()));
  sql += buildInserts('NodeRascis', rascis);

  await db.sequelize.close();


  fs.writeFileSync(output, sql);
  console.log('SQL generated at', output);
}

main().catch(err => { console.error(err); process.exit(1); });
