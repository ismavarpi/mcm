const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mcm',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: 'mariadb',
  }
);

const db = {};

// Model definitions
const define = name => require(path.join(__dirname, name))(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Model = define('Model');
db.CategoriaDocumento = define('CategoriaDocumento');
db.Tag = define('Tag');
db.Team = define('Team');
db.Role = define('Role');
db.Node = define('Node');
db.NodeTag = require('./NodeTag')(sequelize);
db.NodeRasci = define('NodeRasci');
db.NodeAttachment = define('NodeAttachment');
db.Parameter = define('Parameter');

// Associations

db.Model.belongsTo(db.Model, { as: 'parent', foreignKey: 'parentId' });
db.Model.hasMany(db.Model, { as: 'children', foreignKey: 'parentId' });

db.Model.hasMany(db.Tag, { as: 'tags', foreignKey: 'modelId' });
db.Tag.belongsTo(db.Model, { foreignKey: 'modelId' });

db.Model.hasMany(db.CategoriaDocumento, { as: 'documentCategories', foreignKey: 'modelId' });
db.CategoriaDocumento.belongsTo(db.Model, { foreignKey: { name: 'modelId', allowNull: true } });

db.Model.hasMany(db.Team, { as: 'teams', foreignKey: 'modelId' });
db.Team.belongsTo(db.Model, { foreignKey: 'modelId' });

db.Team.hasMany(db.Role, { as: 'roles', foreignKey: 'teamId' });
db.Role.belongsTo(db.Team, { foreignKey: 'teamId' });

db.Model.hasMany(db.Node, { as: 'nodes', foreignKey: 'modelId' });
db.Node.belongsTo(db.Model, { foreignKey: 'modelId' });
db.Node.belongsTo(db.Node, { as: 'parent', foreignKey: 'parentId' });
db.Node.hasMany(db.Node, { as: 'children', foreignKey: 'parentId' });

db.Node.belongsToMany(db.Tag, { through: db.NodeTag, as: 'tags', foreignKey: 'nodeId' });
db.Tag.belongsToMany(db.Node, { through: db.NodeTag, as: 'nodes', foreignKey: 'tagId' });

db.Node.hasMany(db.NodeRasci, { as: 'rascis', foreignKey: 'nodeId' });
db.NodeRasci.belongsTo(db.Node, { foreignKey: 'nodeId' });
db.NodeRasci.belongsTo(db.Role, { foreignKey: 'roleId' });
db.Role.hasMany(db.NodeRasci, { foreignKey: 'roleId' });

db.CategoriaDocumento.hasMany(db.NodeAttachment, { as: 'attachments', foreignKey: 'categoryId' });
db.NodeAttachment.belongsTo(db.CategoriaDocumento, { foreignKey: 'categoryId' });
db.Node.hasMany(db.NodeAttachment, { as: 'attachments', foreignKey: 'nodeId' });
db.NodeAttachment.belongsTo(db.Node, { foreignKey: 'nodeId' });


async function initDatabase(retries = 5, delayMs = 2000) {
  for (let attempt = 1; ; attempt++) {
    try {
      await sequelize.authenticate();

      const queryInterface = sequelize.getQueryInterface();
      let table;
      try {
        table = await queryInterface.describeTable('node_attachments');
      } catch (_) {
        table = null;
      }

      if (table && !table.uuid) {
        await queryInterface.addColumn('node_attachments', 'uuid', {
          type: DataTypes.UUID,
          allowNull: true,
          unique: true,
        });
      }

      await db.Parameter.findOrCreate({
        where: { name: 'Nombre de la aplicación' },
        defaults: { value: 'MCM', defaultValue: 'MCM' }
      });
      await db.Parameter.findOrCreate({
        where: { name: 'Jira URL' },
        defaults: {
          value: 'https://your-domain.atlassian.net',
          defaultValue: 'https://your-domain.atlassian.net'
        }
      });
      await db.Parameter.findOrCreate({
        where: { name: 'Jira usuario' },
        defaults: { value: 'user@example.com', defaultValue: 'user@example.com' }
      });
      await db.Parameter.findOrCreate({
        where: { name: 'Jira token' },
        defaults: { value: 'changeme', defaultValue: 'changeme' }
      });

      const { v4: uuidv4 } = require('uuid');
      if (table) {
        const atts = await db.NodeAttachment.findAll({ where: { uuid: null } });
        for (const att of atts) {
          att.uuid = uuidv4();
          await att.save();
        }
      }

      // Clean rasci lines with missing references before enforcing constraints
      const { Op } = require('sequelize');
      await db.NodeRasci.destroy({ where: { [Op.or]: [{ roleId: null }, { nodeId: null }] } });
      const validRoles = await db.Role.findAll({ attributes: ['id'] });
      const roleIds = validRoles.map(r => r.id);
      if (roleIds.length) {
        await db.NodeRasci.destroy({ where: { roleId: { [Op.notIn]: roleIds } } });
      }

      await sequelize.sync({ alter: true });
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.error(`Database connection failed (attempt ${attempt}). Retrying...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

db.initDatabase = initDatabase;

module.exports = db;
