// Framework web principal
const express = require('express');
// Middleware para parsear cuerpos JSON
const bodyParser = require('body-parser');
// Habilitamos CORS para permitir peticiones remotas
const cors = require('cors');
// Librería ORM para gestionar la base de datos
const { Sequelize, DataTypes, Op } = require('sequelize');
// Manejo de cargas de ficheros
const multer = require('multer');
// Acceso al sistema de archivos
const fs = require('fs');
// Utilidades de rutas
const path = require('path');

// Cargamos las variables de entorno desde .env
require("dotenv").config();
// Creamos la aplicación de Express
const app = express();
// Activamos CORS en todas las rutas
app.use(cors());
// Habilitamos el parseo automático de JSON
app.use(bodyParser.json());
// Configuramos multer para almacenar archivos subidos en la carpeta uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });
// Servimos estáticamente los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a la base de datos utilizando Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mcm', // nombre de la base
  process.env.DB_USER || 'root', // usuario
  process.env.DB_PASSWORD || '', // contraseña
  {
  host: process.env.DB_HOST || 'localhost', // host de la base
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306, // puerto
  dialect: 'mariadb' // tipo de base de datos
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

const CategoriaDocumento = sequelize.define('CategoriaDocumento', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Permitir nulos para evitar fallos de sincronización con registros
  // existentes cuando la columna aún no estaba definida.
  modelId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, { tableName: 'categoria_documentos' });

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
Model.hasMany(CategoriaDocumento, { as: 'documentCategories', foreignKey: 'modelId' });
// El vínculo permite valores nulos para compatibilidad con bases de datos ya
// existentes donde la columna pueda carecer de dato inicial.
CategoriaDocumento.belongsTo(Model, { foreignKey: { name: 'modelId', allowNull: true } });

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
    defaultValue: 0,
  },
  codePattern: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'ORDER',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
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

CategoriaDocumento.hasMany(NodeAttachment, { as: 'attachments', foreignKey: 'categoryId' });
NodeAttachment.belongsTo(CategoriaDocumento, { foreignKey: 'categoryId' });
Node.hasMany(NodeAttachment, { as: 'attachments', foreignKey: 'nodeId' });
NodeAttachment.belongsTo(Node, { foreignKey: 'nodeId' });

async function addTagsToDescendants(parentId, tagIds) {
  const children = await Node.findAll({ where: { parentId } });
  for (const child of children) {
    const currentTags = await child.getTags();
    const currentIds = currentTags.map(t => t.id);
    const newIds = Array.from(new Set([...currentIds, ...tagIds]));
    await child.setTags(newIds);
    await addTagsToDescendants(child.id, tagIds);
  }
}

async function removeTagsFromDescendants(parentId, tagIds) {
  const children = await Node.findAll({ where: { parentId } });
  for (const child of children) {
    const currentTags = await child.getTags();
    const currentIds = currentTags.map(t => t.id);
    const newIds = currentIds.filter(id => !tagIds.includes(id));
    await child.setTags(newIds);
    await removeTagsFromDescendants(child.id, tagIds);
  }
}

async function computeNodeCode(node) {
  let prefix = '';
  if (node.parentId) {
    const parent = await Node.findByPk(node.parentId);
    prefix = parent.code ? parent.code + '.' : '';
  }
  let part;
  if (node.codePattern === 'ORDER') {
    if (!node.order || node.order === 0) {
      const max = await Node.max('order', { where: { parentId: node.parentId, codePattern: 'ORDER' } });
      node.order = (max || 0) + 1;
    }
    part = String(node.order);
  } else {
    part = node.codePattern;
  }
  return prefix + part;
}

async function updateNodeAndDescendants(node) {
  node.code = await computeNodeCode(node);
  await node.save();
  const children = await Node.findAll({ where: { parentId: node.id } });
  for (const child of children) {
    await updateNodeAndDescendants(child);
  }
}

async function recalculateSiblingOrders(parentId) {
  const siblings = await Node.findAll({
    where: { parentId },
    order: [['order', 'ASC']]
  });
  let current = 1;
  for (const sib of siblings) {
    if (sib.codePattern === 'ORDER') {
      sib.order = current++;
      await updateNodeAndDescendants(sib);
    }
  }
}

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

async function initDatabase(retries = 5, delayMs = 2000) {
  for (let attempt = 1; ; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      await Parameter.findOrCreate({
        where: { name: 'Nombre de la aplicación' },
        defaults: { value: 'MCM', defaultValue: 'MCM' }
      });
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.error(`Database connection failed (attempt ${attempt}). Retrying...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

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
  if (req.body.parentId && parseInt(req.body.parentId) === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'Un modelo no puede ser su propio padre' });
  }
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
  res.status(405).json({ error: 'Eliminar parámetros no permitido' });
});

// Document category routes
app.get('/api/models/:modelId/categoria-documentos', async (req, res) => {
  const cats = await CategoriaDocumento.findAll({ where: { modelId: req.params.modelId } });
  res.json(cats);
});

app.post('/api/models/:modelId/categoria-documentos', async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.modelId);
    if (!model) return res.status(404).json({ error: 'Modelo no encontrado' });
    const cat = await CategoriaDocumento.create({
      ...req.body,
      modelId: model.id
    });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

app.put('/api/categoria-documentos/:id', async (req, res) => {
  try {
    const cat = await CategoriaDocumento.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    await cat.update(req.body);
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

app.delete('/api/categoria-documentos/:id', async (req, res) => {
  await CategoriaDocumento.destroy({ where: { id: req.params.id } });
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
    ],
    order: [['parentId','ASC'], ['order','ASC']]
  });
  res.json(nodes);
});

app.post('/api/models/:modelId/nodes', async (req, res) => {
  const { tagIds = [], rasci, codePattern = 'ORDER', ...data } = req.body;
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
  await updateNodeAndDescendants(node);
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

app.put('/api/nodes/:id', async (req, res) => {
  const { tagIds = [], rasci, codePattern = 'ORDER', ...data } = req.body;
  const node = await Node.findByPk(req.params.id, { include: { model: Tag, as: 'tags' } });
  if (codePattern !== 'ORDER') {
    if (!codePattern.trim()) return res.status(400).json({ error: 'Código requerido' });
    const conflict = await Node.findOne({ where: { parentId: data.parentId ?? node.parentId, codePattern, id: { [Op.ne]: node.id } } });
    if (conflict) return res.status(400).json({ error: 'Código duplicado' });
  }
  const previousPattern = node.codePattern;
  await node.update({ ...data, codePattern });
  await updateNodeAndDescendants(node);
  if (previousPattern === 'ORDER' && codePattern !== 'ORDER') {
    await recalculateSiblingOrders(node.parentId);
  }
  const oldTagIds = node.tags.map(t => t.id);
  const parentTags = node.parentId
    ? (await Node.findByPk(node.parentId, { include: { model: Tag, as: 'tags' } })).tags.map(t => t.id)
    : [];
  const finalTags = Array.from(new Set([...tagIds, ...parentTags]));
  await node.setTags(finalTags);
  const added = finalTags.filter(id => !oldTagIds.includes(id));
  const removed = oldTagIds.filter(id => !finalTags.includes(id));
  if (added.length) await addTagsToDescendants(node.id, added);
  if (removed.length) await removeTagsFromDescendants(node.id, removed);
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

app.post('/api/nodes/:id/move', async (req, res) => {
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
  await recalculateSiblingOrders(node.parentId);
  res.json(node);
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
    include: { model: CategoriaDocumento }
  });
  res.json(attachments);
});

app.post('/api/nodes/:nodeId/attachments', upload.single('file'), async (req, res) => {
  const { categoryId, name } = req.body;
  if (!req.file) return res.status(400).json({});
  const node = await Node.findByPk(req.params.nodeId);
  const category = await CategoriaDocumento.findByPk(categoryId);
  if (!node || !category || node.modelId !== category.modelId) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }
  const filename = Date.now() + '-' + req.file.originalname;
  const dest = path.join('uploads', filename);
  fs.renameSync(req.file.path, path.join(__dirname, dest));
  const attachment = await NodeAttachment.create({
    nodeId: req.params.nodeId,
    categoryId,
    name,
    filePath: dest
  });
  const full = await NodeAttachment.findByPk(attachment.id, { include: CategoriaDocumento });
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
  const node = await Node.findByPk(id);
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
  if (node) await recalculateSiblingOrders(node.parentId);
}

app.delete('/api/nodes/:id', async (req, res) => {
  await deleteNodeRecursive(req.params.id);
  res.json({});
});

initDatabase()
  .then(() => {
    app.listen(3001, () => console.log('Server running on port 3001'));
  })
  .catch(err => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
