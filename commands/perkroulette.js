const Canvas = require("canvas");
const Discord = require("discord.js");
const { Perks, Users } = require("../dbObjects");
const { Op } = require("sequelize");

module.exports = {
  name: "perkroulette",
  description: "Gets four random perks for survivor or killer",
  usage: "[(killer or survivor) (no args or owned)]",
  async execute(message, args) {
    // only execute command if given a specific role for roulette
    if (
      !args.length ||
      (args[0].toLowerCase() !== "killer" &&
        args[0].toLowerCase() !== "survivor")
    ) {
      return message.reply(
        "You need to specify whether you want killer or survivor perks."
      );
    } else {
      // get the perk role for roulette either killer or survivor
      const perkRole = args[0].toLowerCase();

      let perkList = await Perks.findAll({
        where: {
          role: { [Op.like]: `%${perkRole}` },
        },
      });

      // filter the perks if user specify they only want perks they own
      if (args.length === 2 && args[1].toLowerCase() === "owned") {
        // get the user from the User table
        const user = await Users.findOne({
          where: { user_id: message.author.id },
        });

        // get list of all dlc user owns from the UesrsDLC table
        const ownedDLC = await user.getDLCs();

        // create a list of dlc the user owns by name
        const ownedDLCList = ownedDLC.map((userDLC) => userDLC.dlc.name);

        // filter the perk list to only contain perks that the user owns
        perkList = perkList.filter((perk) => ownedDLCList.includes(perk.dlc));

        if (perkList.length === 0) {
          return message.reply(
            "You have no Dead by Daylight DLCs owned. Please add them using the ~dbddlc command."
          );
        } else if (perkList.length < 4) {
          return message.reply(
            "You must have atleast four perks in your collection to run this command."
          );
        }
      }

      const roulettePerks = new Set();

      // add random perks until four perks are found
      while (roulettePerks.size < 4) {
        const randomPerk =
          perkList[Math.floor(Math.random() * perkList.length)];

        // if user wants only perks they own
        roulettePerks.add(randomPerk);
      }

      // create the embedded message to send to the user
      const roulettePerksEmbed = new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Perk Roulette")
        .addField("\u200B", "\u200B");

      // create the canvas to hold all images of the roulette perks
      const canvas = Canvas.createCanvas(1000, 250);

      const ctx = canvas.getContext("2d");

      const perkBaseImgURL =
        "https://raw.githubusercontent.com/dearvoodoo/dbd/master/Perks/";

      let imageX = 0;

      for (const perk of roulettePerks) {
        // add the name of the perk
        roulettePerksEmbed.addField(perk.name, "\u200B");
        // load the perk image and add it to the canvas
        const perkImage = await Canvas.loadImage(
          perkBaseImgURL + `${perk.name_tag}.png`
        );
        ctx.drawImage(perkImage, imageX, 0, 250, 250);
        imageX += 250;
      }

      // attach the full perk image to the embed
      const attachment = new Discord.MessageAttachment(
        canvas.toBuffer(),
        "roulettePerks.png"
      );

      roulettePerksEmbed.attachFiles(attachment);

      message.channel.send(roulettePerksEmbed);
    }
  },
};
