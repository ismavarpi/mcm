const express = require('express');
const { Role } = require('../models');
const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const roles = await Role.findAll({ where: { teamId: req.params.teamId } });
  res.json(roles);
});

router.post('/', async (req, res) => {
  const role = await Role.create({ ...req.body, teamId: req.params.teamId });
  res.json(role);
});

router.put('/:id', async (req, res) => {
  await Role.update(req.body, { where: { id: req.params.id } });
  const role = await Role.findByPk(req.params.id);
  res.json(role);
});

router.delete('/:id', async (req, res) => {
  await Role.destroy({ where: { id: req.params.id } });
  res.json({});
});

module.exports = router;
