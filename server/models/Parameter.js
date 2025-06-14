module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Parameter', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    defaultValue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
