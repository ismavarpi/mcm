module.exports = (sequelize, DataTypes) => {
  return sequelize.define('NodeRasci', {
    responsibilities: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
};
