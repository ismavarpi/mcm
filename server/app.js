const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./models');
const session = require('express-session');

const app = express();
app.use(cors());
app.use(bodyParser.json());
if (process.env.USE_AUTH && process.env.USE_AUTH !== 'false') {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mcm-secret',
    resave: false,
    saveUninitialized: false
  }));
}

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
const jiraRoutes = require('./routes/jira');
const imageRoutes = require('./routes/images');
const authRoutes = require('./routes/auth');

if (process.env.USE_AUTH && process.env.USE_AUTH !== 'false') {
  app.use('/api/auth', authRoutes);
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) return next();
    if (req.session && req.session.user) return next();
    res.status(401).json({ error: 'Unauthorized' });
  });
}
app.use('/api/models', modelRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/models/:modelId/tags', tagRoutes);
app.use('/api/models/:modelId/teams', teamRoutes);
app.use('/api/teams/:teamId/roles', roleRoutes);
app.use('/api/models/:modelId/categoria-documentos', categoriaRoutes);
app.use('/api/models/:modelId/nodes', nodeRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/images', imageRoutes);
app.use('/uploads', express.static(uploadDir));

module.exports = { app, db };
