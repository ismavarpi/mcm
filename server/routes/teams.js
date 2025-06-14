const express = require('express');
const { Team } = require('../models');
const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const teams = await Team.findAll({ where: { modelId: req.params.modelId } });
  res.json(teams);
});

router.post('/', async (req, res) => {
  const team = await Team.create({ ...req.body, modelId: req.params.modelId });
  res.json(team);
});

router.put('/:id', async (req, res) => {
  await Team.update(req.body, { where: { id: req.params.id } });
  const team = await Team.findByPk(req.params.id);
  res.json(team);
});

router.delete('/:id', async (req, res) => {
  await Team.destroy({ where: { id: req.params.id } });
  res.json({});
});

module.exports = router;
