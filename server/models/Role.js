module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
};
