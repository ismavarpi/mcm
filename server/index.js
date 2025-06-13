const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const upload = multer({ dest: path.join(__dirname, 'uploads') });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mcm',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mariadb'
});

// Model definition for example models
const Model = sequelize.define('Model', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

Model.belongsTo(Model, { as: 'parent', foreignKey: 'parentId' });
Model.hasMany(Model, { as: 'children', foreignKey: 'parentId' });

const DocumentCategory = sequelize.define('DocumentCategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

// Tag definition
const Tag = sequelize.define('Tag', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bgColor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  textColor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Model.hasMany(Tag, { as: 'tags', foreignKey: 'modelId' });
Tag.belongsTo(Model, { foreignKey: 'modelId' });

// Team definition
const Team = sequelize.define('Team', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  modelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Node definition
const Node = sequelize.define('Node', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  modelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Role definition
const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Model.hasMany(Team, { as: 'teams', foreignKey: 'modelId' });
Team.belongsTo(Model, { foreignKey: 'modelId' });
Team.hasMany(Role, { as: 'roles', foreignKey: 'teamId' });
Role.belongsTo(Team, { foreignKey: 'teamId' });

Model.hasMany(Node, { as: 'nodes', foreignKey: 'modelId' });
Node.belongsTo(Model, { foreignKey: 'modelId' });
Node.belongsTo(Node, { as: 'parent', foreignKey: 'parentId' });
Node.hasMany(Node, { as: 'children', foreignKey: 'parentId' });

const NodeTag = sequelize.define('NodeTag', {});
Node.belongsToMany(Tag, { through: NodeTag, as: 'tags', foreignKey: 'nodeId' });
Tag.belongsToMany(Node, { through: NodeTag, as: 'nodes', foreignKey: 'tagId' });

// RASCI relation between nodes and roles
const NodeRasci = sequelize.define('NodeRasci', {
  responsibilities: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const NodeAttachment = sequelize.define('NodeAttachment', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  }
});
Node.hasMany(NodeRasci, { as: 'rascis', foreignKey: 'nodeId' });
NodeRasci.belongsTo(Node, { foreignKey: 'nodeId' });
NodeRasci.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(NodeRasci, { foreignKey: 'roleId' });

DocumentCategory.hasMany(NodeAttachment, { as: 'attachments', foreignKey: 'categoryId' });
NodeAttachment.belongsTo(DocumentCategory, { foreignKey: 'categoryId' });
Node.hasMany(NodeAttachment, { as: 'attachments', foreignKey: 'nodeId' });
NodeAttachment.belongsTo(Node, { foreignKey: 'nodeId' });

// Parameter definition
const Parameter = sequelize.define('Parameter', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  defaultValue: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

sequelize.sync().then(async () => {
  const [param] = await Parameter.findOrCreate({
    where: { name: 'Nombre de la aplicación' },
    defaults: { value: 'MCM', defaultValue: 'MCM' }
  });
});

// CRUD routes
app.get('/api/models', async (req, res) => {
  const models = await Model.findAll();
  res.json(models);
});

app.post('/api/models', async (req, res) => {
  const model = await Model.create(req.body);
  // Create root node automatically
  await Node.create({ name: 'Raiz', modelId: model.id, parentId: null });
  res.json(model);
});

app.put('/api/models/:id', async (req, res) => {
  await Model.update(req.body, { where: { id: req.params.id } });
  const model = await Model.findByPk(req.params.id);
  res.json(model);
});

app.delete('/api/models/:id', async (req, res) => {
  await Model.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Parameter routes
app.get('/api/parameters', async (req, res) => {
  const params = await Parameter.findAll();
  res.json(params);
});

app.get('/api/parameters/byName/:name', async (req, res) => {
  const param = await Parameter.findOne({ where: { name: req.params.name } });
  if (!param) return res.status(404).json({});
  res.json(param);
});

app.post('/api/parameters', async (req, res) => {
  const param = await Parameter.create(req.body);
  res.json(param);
});

app.put('/api/parameters/:id', async (req, res) => {
  await Parameter.update(req.body, { where: { id: req.params.id } });
  const param = await Parameter.findByPk(req.params.id);
  res.json(param);
});

app.post('/api/parameters/:id/reset', async (req, res) => {
  const param = await Parameter.findByPk(req.params.id);
  if (param) {
    param.value = param.defaultValue;
    await param.save();
  }
  res.json(param);
});

app.delete('/api/parameters/:id', async (req, res) => {
  await Parameter.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Document category routes
app.get('/api/document-categories', async (req, res) => {
  const cats = await DocumentCategory.findAll();
  res.json(cats);
});

app.post('/api/document-categories', async (req, res) => {
  const cat = await DocumentCategory.create(req.body);
  res.json(cat);
});

app.put('/api/document-categories/:id', async (req, res) => {
  await DocumentCategory.update(req.body, { where: { id: req.params.id } });
  const cat = await DocumentCategory.findByPk(req.params.id);
  res.json(cat);
});

app.delete('/api/document-categories/:id', async (req, res) => {
  await DocumentCategory.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Tag routes
app.get('/api/models/:modelId/tags', async (req, res) => {
  const tags = await Tag.findAll({ where: { modelId: req.params.modelId } });
  res.json(tags);
});

app.post('/api/models/:modelId/tags', async (req, res) => {
  const tag = await Tag.create({ ...req.body, modelId: req.params.modelId });
  res.json(tag);
});

app.put('/api/tags/:id', async (req, res) => {
  await Tag.update(req.body, { where: { id: req.params.id } });
  const tag = await Tag.findByPk(req.params.id);
  res.json(tag);
});

app.delete('/api/tags/:id', async (req, res) => {
  await Tag.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Team routes
app.get('/api/models/:modelId/teams', async (req, res) => {
  const teams = await Team.findAll({ where: { modelId: req.params.modelId } });
  res.json(teams);
});

app.post('/api/models/:modelId/teams', async (req, res) => {
  const team = await Team.create({ ...req.body, modelId: req.params.modelId });
  res.json(team);
});

app.put('/api/teams/:id', async (req, res) => {
  await Team.update(req.body, { where: { id: req.params.id } });
  const team = await Team.findByPk(req.params.id);
  res.json(team);
});

app.delete('/api/teams/:id', async (req, res) => {
  await Team.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Role routes
app.get('/api/teams/:teamId/roles', async (req, res) => {
  const roles = await Role.findAll({ where: { teamId: req.params.teamId } });
  res.json(roles);
});

app.post('/api/teams/:teamId/roles', async (req, res) => {
  const role = await Role.create({ ...req.body, teamId: req.params.teamId });
  res.json(role);
});

app.put('/api/roles/:id', async (req, res) => {
  await Role.update(req.body, { where: { id: req.params.id } });
  const role = await Role.findByPk(req.params.id);
  res.json(role);
});

app.delete('/api/roles/:id', async (req, res) => {
  await Role.destroy({ where: { id: req.params.id } });
  res.json({});
});

// Node routes
app.get('/api/models/:modelId/nodes', async (req, res) => {
  const nodes = await Node.findAll({
    where: { modelId: req.params.modelId },
    include: [
      { model: Tag, as: 'tags' },
      { model: NodeRasci, as: 'rascis', include: { model: Role, include: Team } }
    ]
  });
  res.json(nodes);
});

app.post('/api/models/:modelId/nodes', async (req, res) => {
  const { tagIds, rasci, ...data } = req.body;
  const node = await Node.create({ ...data, modelId: req.params.modelId });
  if (tagIds) await node.setTags(tagIds);
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

app.put('/api/nodes/:id', async (req, res) => {
  const { tagIds, rasci, ...data } = req.body;
  await Node.update(data, { where: { id: req.params.id } });
  const node = await Node.findByPk(req.params.id);
  if (tagIds) await node.setTags(tagIds);
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

app.get('/api/nodes/:id/tags', async (req, res) => {
  const node = await Node.findByPk(req.params.id, { include: { model: Tag, as: 'tags' } });
  if (!node) return res.status(404).json([]);
  res.json(node.tags);
});

app.post('/api/nodes/:id/tags', async (req, res) => {
  const node = await Node.findByPk(req.params.id);
  if (!node) return res.status(404).json([]);
  await node.setTags(req.body.tagIds || []);
  const tags = await node.getTags();
  res.json(tags);
});

app.get('/api/nodes/:id/rascis', async (req, res) => {
  const rascis = await NodeRasci.findAll({
    where: { nodeId: req.params.id },
    include: { model: Role, include: Team }
  });
  res.json(rascis);
});

// Attachment routes
app.get('/api/nodes/:nodeId/attachments', async (req, res) => {
  const attachments = await NodeAttachment.findAll({
    where: { nodeId: req.params.nodeId },
    include: { model: DocumentCategory }
  });
  res.json(attachments);
});

app.post('/api/nodes/:nodeId/attachments', upload.single('file'), async (req, res) => {
  const { categoryId, name } = req.body;
  if (!req.file) return res.status(400).json({});
  const filename = Date.now() + '-' + req.file.originalname;
  const dest = path.join('uploads', filename);
  fs.renameSync(req.file.path, path.join(__dirname, dest));
  const attachment = await NodeAttachment.create({
    nodeId: req.params.nodeId,
    categoryId,
    name,
    filePath: dest
  });
  const full = await NodeAttachment.findByPk(attachment.id, { include: DocumentCategory });
  res.json(full);
});

app.delete('/api/attachments/:id', async (req, res) => {
  const att = await NodeAttachment.findByPk(req.params.id);
  if (att) {
    try { fs.unlinkSync(path.join(__dirname, att.filePath)); } catch (e) {}
    await att.destroy();
  }
  res.json({});
});

async function deleteNodeRecursive(id) {
  const children = await Node.findAll({ where: { parentId: id } });
  for (const child of children) {
    await deleteNodeRecursive(child.id);
  }
  const atts = await NodeAttachment.findAll({ where: { nodeId: id } });
  for (const att of atts) {
    try { fs.unlinkSync(path.join(__dirname, att.filePath)); } catch (e) {}
    await att.destroy();
  }
  await Node.destroy({ where: { id } });
}

app.delete('/api/nodes/:id', async (req, res) => {
  await deleteNodeRecursive(req.params.id);
  res.json({});
});

app.listen(3001, () => console.log('Server running on port 3001')); 
