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

// Model definition
const Model = sequelize.define('Model', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

sequelize.sync();

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

app.listen(3001, () => console.log('Server running on port 3001')); 
