const express = require('express');
const { Model, Node } = require('../models');
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

module.exports = router;
