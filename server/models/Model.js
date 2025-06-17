module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Model', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });
};
