const express = require('express');
const { Tag } = require('../models');
const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const tags = await Tag.findAll({ where: { modelId: req.params.modelId } });
  res.json(tags);
});

router.post('/', async (req, res) => {
  const tag = await Tag.create({ ...req.body, modelId: req.params.modelId });
  res.json(tag);
});

router.put('/:id', async (req, res) => {
  await Tag.update(req.body, { where: { id: req.params.id } });
  const tag = await Tag.findByPk(req.params.id);
  res.json(tag);
});

router.delete('/:id', async (req, res) => {
  await Tag.destroy({ where: { id: req.params.id } });
  res.json({});
});

module.exports = router;
