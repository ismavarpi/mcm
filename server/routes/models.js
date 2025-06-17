const express = require('express');
const { Model, Node, Tag, NodeRasci, Role, Team } = require('../models');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const models = await Model.findAll();
  res.json(models);
});

router.post('/', async (req, res) => {
  const { name, author, parentId, isPublic } = req.body;
  const model = await Model.create({
    name,
    author,
    parentId,
    isPublic,
  });
  await Node.create({ name: 'Raiz', modelId: model.id, parentId: null });
  res.json(model);
});

router.put('/:id', async (req, res) => {
  if (req.body.parentId && parseInt(req.body.parentId) === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'Un modelo no puede ser su propio padre' });
  }
  const { name, author, parentId, isPublic } = req.body;
  await Model.update({ name, author, parentId, isPublic }, { where: { id: req.params.id } });
  const model = await Model.findByPk(req.params.id);
  res.json(model);
});

router.delete('/:id', async (req, res) => {
  await Model.destroy({ where: { id: req.params.id } });
  res.json({});
});

router.post('/:id/generate-rascis', async (req, res) => {
  const modelId = req.params.id;
  const nodes = await Node.findAll({ where: { modelId } });
  const teams = await Team.findAll({ where: { modelId } });
  const roles = [];
  for (const team of teams) {
    const rs = await Role.findAll({ where: { teamId: team.id } });
    roles.push(...rs);
  }
  for (const node of nodes) {
    for (const role of roles) {
      const exists = await NodeRasci.findOne({ where: { nodeId: node.id, roleId: role.id } });
      if (!exists) {
        await NodeRasci.create({ nodeId: node.id, roleId: role.id, responsibilities: '' });
      }
    }
  }
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

router.get('/:id/roles', async (req, res) => {
  const teams = await Team.findAll({ where: { modelId: req.params.id } });
  const result = [];
  for (const team of teams) {
    const roles = await Role.findAll({ where: { teamId: team.id } });
    result.push({ teamId: team.id, roles });
  }
  res.json(result);
});

module.exports = router;
