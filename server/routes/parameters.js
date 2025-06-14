const express = require('express');
const { Parameter } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  const params = await Parameter.findAll();
  res.json(params);
});

router.get('/byName/:name', async (req, res) => {
  const param = await Parameter.findOne({ where: { name: req.params.name } });
  if (!param) return res.status(404).json({});
  res.json(param);
});

router.post('/', async (req, res) => {
  const param = await Parameter.create(req.body);
  res.json(param);
});

router.put('/:id', async (req, res) => {
  const { name, value } = req.body;
  await Parameter.update({ name, value }, { where: { id: req.params.id } });
  const param = await Parameter.findByPk(req.params.id);
  res.json(param);
});

router.post('/:id/reset', async (req, res) => {
  const param = await Parameter.findByPk(req.params.id);
  if (param) {
    param.value = param.defaultValue;
    await param.save();
  }
  res.json(param);
});

router.delete('/:id', async (req, res) => {
  res.status(405).json({ error: 'Eliminar parámetros no permitido' });
});

module.exports = router;
