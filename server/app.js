const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routers
const modelRoutes = require('./routes/models');
const parameterRoutes = require('./routes/parameters');
const tagRoutes = require('./routes/tags');
const teamRoutes = require('./routes/teams');
const roleRoutes = require('./routes/roles');
const categoriaRoutes = require('./routes/categoriaDocumentos');
const nodeRoutes = require('./routes/nodes');
const dataRoutes = require('./routes/data');

app.use('/api/models', modelRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/models/:modelId/tags', tagRoutes);
app.use('/api/models/:modelId/teams', teamRoutes);
app.use('/api/teams/:teamId/roles', roleRoutes);
app.use('/api/models/:modelId/categoria-documentos', categoriaRoutes);
app.use('/api/models/:modelId/nodes', nodeRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/data', dataRoutes);

module.exports = { app, db };
