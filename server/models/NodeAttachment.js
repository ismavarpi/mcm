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
  });
};
