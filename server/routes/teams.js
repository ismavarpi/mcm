const express = require('express');
const { Team, Role, NodeRasci } = require('../models');
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

router.get('/:id/delete-info', async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) return res.status(404).json({});
  const roles = await Role.findAll({ where: { teamId: team.id } });
  const roleIds = roles.map(r => r.id);
  const rasciCount = roleIds.length
    ? await NodeRasci.count({ where: { roleId: roleIds } })
    : 0;
  res.json({
    team: { id: team.id, name: team.name },
    roles: roles.map(r => ({ id: r.id, name: r.name })),
    rasciCount
  });
});

router.delete('/:id', async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (team) {
    const roles = await Role.findAll({ where: { teamId: team.id } });
    const roleIds = roles.map(r => r.id);
    if (roleIds.length) {
      await NodeRasci.destroy({ where: { roleId: roleIds } });
      await Role.destroy({ where: { id: roleIds } });
    }
    await team.destroy();
  }
  res.json({});
});

module.exports = router;
