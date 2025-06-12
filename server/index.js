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

app.listen(3001, () => console.log('Server running on port 3001')); 
