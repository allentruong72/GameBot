module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "perks",
    {
      name: DataTypes.STRING,
      name_tag: DataTypes.STRING,
      role_name: DataTypes.STRING,
      role_name_tag: DataTypes.STRING,
      role: DataTypes.STRING,
      dlc: DataTypes.STRING,
      dlc_appid: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
};
