const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');
const { Node, Tag, NodeRasci, Role, Team, CategoriaDocumento, NodeAttachment } = require('../models');
const {
  addTagsToDescendants,
  removeTagsFromDescendants,
  updateNodeAndDescendants,
  recalculateSiblingOrders,
} = require('../utils/nodeUtils');

const router = express.Router({ mergeParams: true });
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

function validateRasciLines(rasci) {
  if (!rasci || !rasci.length) return;
  let countA = 0;
  let countR = 0;
  const usedRoles = new Set();
  for (const line of rasci) {
    if (line.responsibilities.includes('A')) countA++;
    if (line.responsibilities.includes('R')) countR++;
    if (usedRoles.has(line.roleId)) {
      throw new Error('Un rol sólo puede aparecer una vez en el RASCI del nodo');
    }
    usedRoles.add(line.roleId);
  }
  if (countA === 0 || countR === 0) {
    throw new Error('Debe existir al menos un rol con responsabilidad A y otro con responsabilidad R');
  }
  if (countA > 1 || countR > 1) {
    throw new Error('Solo puede haber un rol con responsabilidad A y uno con responsabilidad R');
  }
}

router.get('/', async (req, res) => {
  const nodes = await Node.findAll({
    where: { modelId: req.params.modelId },
    include: [
      { model: Tag, as: 'tags' },
      { model: NodeRasci, as: 'rascis', include: { model: Role, include: Team } }
    ],
    order: [['parentId', 'ASC'], ['order', 'ASC']]
  });
  res.json(nodes);
});

router.post('/', async (req, res) => {
  const { tagIds = [], rasci, codePattern = 'ORDER', ...data } = req.body;
  try {
    validateRasciLines(rasci);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const parentTags = data.parentId
    ? (await Node.findByPk(data.parentId, { include: { model: Tag, as: 'tags' } })).tags.map(t => t.id)
    : [];
  const finalTags = Array.from(new Set([...tagIds, ...parentTags]));
  if (codePattern !== 'ORDER') {
    if (!codePattern.trim()) return res.status(400).json({ error: 'Código requerido' });
    const conflict = await Node.findOne({ where: { parentId: data.parentId || null, codePattern } });
    if (conflict) return res.status(400).json({ error: 'Código duplicado' });
  }
  const node = await Node.create({ ...data, modelId: req.params.modelId, codePattern });
  await updateNodeAndDescendants(Node, node);
  if (finalTags.length) await node.setTags(finalTags);
  if (rasci && rasci.length) {
    for (const line of rasci) {
      await NodeRasci.create({ nodeId: node.id, roleId: line.roleId, responsibilities: line.responsibilities.join('') });
    }
  }
  const withAssociations = await Node.findByPk(node.id, { include: [
    { model: Tag, as: 'tags' },
    { model: NodeRasci, as: 'rascis', include: { model: Role, include: Team } }
  ] });
  res.json(withAssociations);
});

router.put('/:id', async (req, res) => {
  const { tagIds = [], rasci, codePattern = 'ORDER', ...data } = req.body;
  try {
    validateRasciLines(rasci);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const node = await Node.findByPk(req.params.id, { include: { model: Tag, as: 'tags' } });
  if (codePattern !== 'ORDER') {
    if (!codePattern.trim()) return res.status(400).json({ error: 'Código requerido' });
    const conflict = await Node.findOne({ where: { parentId: data.parentId ?? node.parentId, codePattern, id: { [Op.ne]: node.id } } });
    if (conflict) return res.status(400).json({ error: 'Código duplicado' });
  }
  const previousPattern = node.codePattern;
  const oldParentId = node.parentId;
  await node.update({ ...data, codePattern });
  await updateNodeAndDescendants(Node, node);
  const parentChanged = node.parentId !== oldParentId;
  if (parentChanged) {
    if (oldParentId) await recalculateSiblingOrders(Node, oldParentId);
    await recalculateSiblingOrders(Node, node.parentId);
  } else if (previousPattern === 'ORDER' && codePattern !== 'ORDER') {
    await recalculateSiblingOrders(Node, node.parentId);
  }
  const oldTagIds = node.tags.map(t => t.id);
  const parentTags = node.parentId
    ? (await Node.findByPk(node.parentId, { include: { model: Tag, as: 'tags' } })).tags.map(t => t.id)
    : [];
  const finalTags = Array.from(new Set([...tagIds, ...parentTags]));
  await node.setTags(finalTags);
  const added = finalTags.filter(id => !oldTagIds.includes(id));
  const removed = oldTagIds.filter(id => !finalTags.includes(id));
  if (added.length) await addTagsToDescendants(Node, node.id, added);
  if (removed.length) await removeTagsFromDescendants(Node, node.id, removed);
  if (rasci) {
    await NodeRasci.destroy({ where: { nodeId: node.id } });
    for (const line of rasci) {
      await NodeRasci.create({ nodeId: node.id, roleId: line.roleId, responsibilities: line.responsibilities.join('') });
    }
  }
  const withAssociations = await Node.findByPk(node.id, { include: [
    { model: Tag, as: 'tags' },
    { model: NodeRasci, as: 'rascis', include: { model: Role, include: Team } }
  ] });
  res.json(withAssociations);
});

router.post('/:id/move', async (req, res) => {
  const { direction } = req.body;
  const node = await Node.findByPk(req.params.id);
  if (!node) return res.status(404).json({});
  const siblings = await Node.findAll({
    where: { parentId: node.parentId },
    order: [['order', 'ASC']]
  });
  const index = siblings.findIndex(s => s.id === node.id);
  if (direction === 'up' && index > 0) {
    const target = siblings[index - 1];
    const tmp = node.order;
    node.order = target.order;
    target.order = tmp;
    await node.save();
    await target.save();
  } else if (direction === 'down' && index < siblings.length - 1) {
    const target = siblings[index + 1];
    const tmp = node.order;
    node.order = target.order;
    target.order = tmp;
    await node.save();
    await target.save();
  }
  await recalculateSiblingOrders(Node, node.parentId);
  res.json(node);
});

router.get('/:id/tags', async (req, res) => {
  const node = await Node.findByPk(req.params.id, { include: { model: Tag, as: 'tags' } });
  if (!node) return res.status(404).json([]);
  res.json(node.tags);
});

router.post('/:id/tags', async (req, res) => {
  const node = await Node.findByPk(req.params.id);
  if (!node) return res.status(404).json([]);
  await node.setTags(req.body.tagIds || []);
  const tags = await node.getTags();
  res.json(tags);
});

router.get('/:id/rascis', async (req, res) => {
  const rascis = await NodeRasci.findAll({
    where: { nodeId: req.params.id },
    include: { model: Role, include: Team }
  });
  res.json(rascis);
});

router.get('/:nodeId/attachments', async (req, res) => {
  const attachments = await NodeAttachment.findAll({
    where: { nodeId: req.params.nodeId },
    include: { model: CategoriaDocumento }
  });
  res.json(attachments);
});

router.post('/:nodeId/attachments', upload.single('file'), async (req, res) => {
  const { categoryId, name } = req.body;
  if (!req.file) return res.status(400).json({});
  const node = await Node.findByPk(req.params.nodeId);
  const category = await CategoriaDocumento.findByPk(categoryId);
  if (!node || !category || node.modelId !== category.modelId) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }
  const filename = Date.now() + '-' + req.file.originalname;
  const dest = path.join('uploads', filename);
  fs.renameSync(req.file.path, path.join(__dirname, '..', dest));
  const attachment = await NodeAttachment.create({
    nodeId: req.params.nodeId,
    categoryId,
    name,
    filePath: dest
  });
  const full = await NodeAttachment.findByPk(attachment.id, { include: CategoriaDocumento });
  res.json(full);
});

router.get('/attachments/:id/download', async (req, res) => {
  const att = await NodeAttachment.findByPk(req.params.id);
  if (!att) return res.status(404).end();
  const file = path.join(__dirname, '..', att.filePath);
  res.download(file, att.name);
});

router.delete('/attachments/:id', async (req, res) => {
  const att = await NodeAttachment.findByPk(req.params.id);
  if (att) {
    try { fs.unlinkSync(path.join(__dirname, '..', att.filePath)); } catch (e) {}
    await att.destroy();
  }
  res.json({});
});

async function deleteNodeRecursive(id) {
  const node = await Node.findByPk(id);
  const children = await Node.findAll({ where: { parentId: id } });
  for (const child of children) {
    await deleteNodeRecursive(child.id);
  }
  const atts = await NodeAttachment.findAll({ where: { nodeId: id } });
  for (const att of atts) {
    try { fs.unlinkSync(path.join(__dirname, '..', att.filePath)); } catch (e) {}
    await att.destroy();
  }
  await Node.destroy({ where: { id } });
  if (node) await recalculateSiblingOrders(Node, node.parentId);
}

router.delete('/:id', async (req, res) => {
  await deleteNodeRecursive(req.params.id);
  res.json({});
});

module.exports = router;
