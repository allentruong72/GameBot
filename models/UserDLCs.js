module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "user_dlc",
    {
      user_id: DataTypes.STRING,
      dlc_id: { type: DataTypes.STRING, unique: true },
    },
    {
      timestamps: false,
    }
  );
};
