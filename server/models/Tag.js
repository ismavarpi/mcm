module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bgColor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
