module.exports = (sequelize, DataTypes) => {
  return sequelize.define('NodeRasci', {
    responsibilities: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
