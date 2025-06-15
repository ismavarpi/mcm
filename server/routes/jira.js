const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/projects', async (req, res) => {
  const { url, email, token } = req.body;
  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const response = await axios.get(`${url.replace(/\/$/, '')}/rest/api/3/project/search`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const projects = (response.data.values || []).map(p => ({ key: p.key, name: p.name }));
    res.json(projects);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
