module.exports = (sequelize, DataTypes) => {
  return sequelize.define('CategoriaDocumento', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, { tableName: 'categoria_documentos' });
};
