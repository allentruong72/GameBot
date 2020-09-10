module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "dlc",
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
      },
      app_id: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: false,
    }
  );
};
