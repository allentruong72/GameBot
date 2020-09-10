module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "users",
    {
      user_id: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
};
