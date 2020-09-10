const { Op, Sequelize } = require("sequelize");

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

const DLC = require("./models/DLC")(sequelize, Sequelize.DataTypes);
const Users = require("./models/Users")(sequelize, Sequelize.DataTypes);
const UserDLCs = require("./models/UserDLCs")(sequelize, Sequelize.DataTypes);
const Perks = require("./models/Perks")(sequelize, Sequelize.DataTypes);

UserDLCs.belongsTo(DLC, { foreignKey: "dlc_id", as: "dlc" });

// add a DLC to a user's collection
Users.prototype.addDLC = async function (dlc) {
  return UserDLCs.create({ user_id: this.user_id, dlc_id: dlc.id });
};

// find all DLCs that are in a user's collection
Users.prototype.getDLCs = async function () {
  return UserDLCs.findAll({
    where: { user_id: this.user_id },
    include: ["dlc"],
  });
};

// remove a DLC from a user's collection
Users.prototype.removeDLC = async function (targetDLC) {
  return UserDLCs.destroy({
    where: { [Op.and]: [{ user_id: this.user_id }, { dlc_id: targetDLC.id }] },
  });
};

// find a DLC by the id, app_id, or name
DLC.findDLC = async function (targetDLC) {
  return DLC.findOne({
    where: {
      [Op.or]: [
        { id: targetDLC },
        { app_id: targetDLC },
        { name: { [Op.like]: `%${targetDLC}` } },
      ],
    },
  });
};

module.exports = { Users, DLC, Perks, UserDLCs };
