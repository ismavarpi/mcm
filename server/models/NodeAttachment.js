module.exports = (sequelize, DataTypes) => {
  return sequelize.define('NodeAttachment', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    nodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  }, { tableName: 'node_attachments' });
};
