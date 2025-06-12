const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME || 'mcm', process.env.DB_USER || 'root', process.env.DB_PASS || '', {
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
  modelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

Model.hasMany(Node, { as: 'nodes', foreignKey: 'modelId' });
Node.belongsTo(Model, { foreignKey: 'modelId' });
Node.belongsTo(Node, { as: 'parent', foreignKey: 'parentId' });
Node.hasMany(Node, { as: 'children', foreignKey: 'parentId' });

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
// Node routes
app.get('/api/models/:modelId/nodes', async (req, res) => {
  const nodes = await Node.findAll({ where: { modelId: req.params.modelId } });
  res.json(nodes);
});

app.post('/api/models/:modelId/nodes', async (req, res) => {
  const node = await Node.create({ ...req.body, modelId: req.params.modelId });
  res.json(node);
});

app.put('/api/nodes/:id', async (req, res) => {
  await Node.update(req.body, { where: { id: req.params.id } });
  const node = await Node.findByPk(req.params.id);
  res.json(node);
});

app.delete('/api/nodes/:id', async (req, res) => {
  await Node.destroy({ where: { id: req.params.id } });
  res.json({});
});

app.listen(3001, () => console.log('Server running on port 3001')); 
