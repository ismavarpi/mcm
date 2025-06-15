const express = require('express');
const { Model, Node, Tag, NodeRasci, Role, Team } = require('../models');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const models = await Model.findAll();
  res.json(models);
});

router.post('/', async (req, res) => {
  const model = await Model.create(req.body);
  await Node.create({ name: 'Raiz', modelId: model.id, parentId: null });
  res.json(model);
});

router.put('/:id', async (req, res) => {
  if (req.body.parentId && parseInt(req.body.parentId) === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'Un modelo no puede ser su propio padre' });
  }
  await Model.update(req.body, { where: { id: req.params.id } });
  const model = await Model.findByPk(req.params.id);
  res.json(model);
});

router.delete('/:id', async (req, res) => {
  await Model.destroy({ where: { id: req.params.id } });
  res.json({});
});

async function getLeafNodes(modelId) {
  const nodes = await Node.findAll({
    where: { modelId },
    include: [
      { model: Tag, as: 'tags' },
      { model: NodeRasci, as: 'rascis', include: { model: Role, include: Team } }
    ],
    order: [['parentId', 'ASC'], ['order', 'ASC']]
  });
  const parents = new Set(nodes.map(n => n.parentId).filter(id => id));
  return nodes.filter(n => !parents.has(n.id));
}

function buildDescription(node) {
  let text = node.description || '';
  if (node.tags && node.tags.length) {
    text += `\nEtiquetas: ${node.tags.map(t => t.name).join(', ')}`;
  }
  if (node.rascis && node.rascis.length) {
    text += '\nRASCI:';
    node.rascis.forEach(r => {
      text += `\n- ${r.Role.Team.name} / ${r.Role.name}: ${r.responsibilities}`;
    });
  }
  return text;
}

router.get('/:id/jira-file', async (req, res) => {
  const nodes = await getLeafNodes(req.params.id);
  const lines = nodes.map(n => {
    const summary = n.name.replace(/"/g, '""');
    const desc = buildDescription(n).replace(/"/g, '""');
    return `"${summary}";"${desc}"`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="jira.csv"');
  res.send(['Summary;Description', ...lines].join('\n'));
});

router.post('/:id/jira-api', async (req, res) => {
  const { url, email, token, projectKey } = req.body;
  const nodes = await getLeafNodes(req.params.id);
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const logs = [];
  for (const node of nodes) {
    const issue = {
      fields: {
        summary: node.name,
        description: buildDescription(node),
        issuetype: { name: 'Task' },
        project: { key: projectKey }
      }
    };
    try {
      await axios.post(`${url.replace(/\/$/, '')}/rest/api/3/issue`, issue, {
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }
      });
      logs.push(`Creado: ${node.name}`);
    } catch (err) {
      const msg = err.response?.data?.errorMessages?.join('; ') || err.message;
      logs.push(`Error ${node.name}: ${msg}`);
    }
  }
  res.json({ log: logs });
});

module.exports = router;
