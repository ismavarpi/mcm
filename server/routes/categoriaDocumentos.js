const express = require('express');
const { CategoriaDocumento, Model } = require('../models');
const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const cats = await CategoriaDocumento.findAll({ where: { modelId: req.params.modelId } });
  res.json(cats);
});

router.post('/', async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.modelId);
    if (!model) return res.status(404).json({ error: 'Modelo no encontrado' });
    const cat = await CategoriaDocumento.create({ ...req.body, modelId: model.id });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  await CategoriaDocumento.destroy({ where: { id: req.params.id } });
  res.json({});
});

module.exports = router;
