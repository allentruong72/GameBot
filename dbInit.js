const fetch = require("node-fetch");
const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

const DLC = require("./models/DLC")(sequelize, Sequelize.DataTypes);
const Perks = require("./models/Perks")(sequelize, Sequelize.DataTypes);
require("./models/Users")(sequelize, Sequelize.DataTypes);
require("./models/UserDLCs")(sequelize, Sequelize.DataTypes);

const force = process.argv.includes("--force") || process.argv.includes("-f");

// creates perk rows to insert into the Perk table
async function createPerkObjects(roleName) {
  // get the list of all Dead by Daylight Perks
  const perkList = await fetch(
    "https://bridge.buddyweb.fr/api/dbd/perks?lang=en"
  ).then((response) => response.json());

  // filter perks by survivor or by killer
  const perkRoleList = perkList.filter(
    (perk) =>
      perk.role.toLowerCase() === roleName.substring(0, roleName.length - 1)
  );

  // get a list of survivor or killer to find the DLC they are associated with
  const roleList = await fetch(
    `https://bridge.buddyweb.fr/api/dbd/${roleName.toLowerCase()}`
  ).then((response) => response.json());

  // add the base game to the DLC list
  roleList.push({
    name: "All",
    isptb: "false",
    dlc: "Base Game",
    dlc_id: 381210,
  });

  const dbdRolePerks = [];

  // for every character
  for (const role of roleList) {
    // filter the perk list by the character
    if (role.isptb === "false") {
      const rolePerks = perkRoleList.filter((perk) => perk.name === role.name);

      // for each perk associated with the character create a perk object and add it into the row
      for (const rolePerk of rolePerks) {
        const rolePerkObject = {
          name: rolePerk.perk_name,
          name_tag: rolePerk.perk_tag,
          role_name: rolePerk.name,
          role_name_tag: rolePerk.name_tag,
          role: rolePerk.role,
          dlc: role.dlc.trim(),
          dlc_appid: role.dlc_id,
        };

        dbdRolePerks.push(Perks.upsert(rolePerkObject));
      }
    }
  }

  return dbdRolePerks;
}

// creates DLC rows to insert into the DLC table
async function createDLCObjects() {
  // get the list of survivors and killers in Dead by Daylight
  const survivorList = await fetch(
    "https://bridge.buddyweb.fr/api/dbd/survivors"
  ).then((response) => response.json());
  const killerList = await fetch(
    "https://bridge.buddyweb.fr/api/dbd/killers"
  ).then((response) => response.json());

  const dbdDLC = [];
  const dbdObject = {};

  // find the DLC the survivors are associated with
  for (const survivor of survivorList) {
    if (!(survivor.dlc.trim() in dbdObject) && survivor.isptb === "false") {
      dbdObject[survivor.dlc.trim()] = survivor.dlc_id;
      dbdDLC.push(
        DLC.upsert({ name: survivor.dlc.trim(), app_id: survivor.dlc_id })
      );
    }
  }

  // find the DLC the killers are associated with
  for (const killer of killerList) {
    if (!(killer.dlc.trim() in dbdObject) && killer.isptb === "false") {
      dbdObject[killer.dlc.trim()] = killer.dlc_id;
      dbdDLC.push(
        DLC.upsert({ name: killer.dlc.trim(), app_id: killer.dlc_id })
      );
    }
  }

  return dbdDLC;
}

sequelize
  .sync({ force })
  .then(async () => {
    const dbdSurvivorPerks = await createPerkObjects("survivors");
    const dbdKillerPerks = await createPerkObjects("killers");
    const dbdDLC = await createDLCObjects();

    await Promise.all(dbdSurvivorPerks);
    await Promise.all(dbdKillerPerks);
    await Promise.all(dbdDLC);
    console.log("Database synced");
    sequelize.close();
  })
  .catch(console.error);
