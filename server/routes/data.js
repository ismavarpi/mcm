const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../models');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'tmp') });

const exportOrder = [
  'Parameter',
  'Model',
  'Team',
  'Role',
  'CategoriaDocumento',
  'Tag',
  'Node',
  'NodeTag',
  'NodeAttachment',
  'NodeRasci'
];

async function generateInsertSQL(model) {
  const table = model.getTableName();
  const rows = await model.findAll({ raw: true });
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `\`${c}\``).join(',');
  const updates = cols.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(',');
  let sql = `-- Entity: ${model.name}\n`;
  for (const row of rows) {
    const vals = cols.map(c => model.sequelize.escape(row[c])).join(',');
    sql += `INSERT INTO \`${table}\` (${colList}) VALUES (${vals}) ON DUPLICATE KEY UPDATE ${updates};\n`;
  }
  return sql + '\n';
}

router.get('/export', async (req, res) => {
  let sql = '';
  for (const name of exportOrder) {
    const model = db[name];
    if (model) sql += await generateInsertSQL(model);
  }
  res.header('Content-Type', 'text/plain');
  res.attachment('export.sql');
  res.send(sql);
});

router.post('/import/preview', upload.single('file'), (req, res) => {
  const content = fs.readFileSync(req.file.path, 'utf-8');
  fs.unlinkSync(req.file.path);
  const entities = Array.from(new Set([...content.matchAll(/-- Entity: (\w+)/g)].map(m => m[1])));
  res.json({ entities });
});

router.post('/import', upload.single('file'), async (req, res) => {
  const selected = req.body.entities ? JSON.parse(req.body.entities) : [];
  const content = fs.readFileSync(req.file.path, 'utf-8');
  fs.unlinkSync(req.file.path);
  const lines = content.split(/\r?\n/);
  const statements = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^-- Entity: (\w+)/);
    if (match) { current = match[1]; continue; }
    if (current && selected.includes(current) && line.trim()) statements.push(line);
  }
  const log = [];
  for (const stmt of statements) {
    try {
      await db.sequelize.query(stmt);
      log.push('OK: ' + stmt);
    } catch (err) {
      log.push('ERROR: ' + stmt + ' -> ' + err.message);
    }
  }
  res.json({ log });
});

module.exports = router;
