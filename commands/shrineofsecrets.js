const Canvas = require("canvas");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const moment = require("moment");
const { Perks } = require("../dbObjects");

module.exports = {
  name: "shrineofsecrets",
  description: "Gets the current available perks from the shrine of secrets",
  aliases: ["shrine", "sos"],
  async execute(message) {
    const perkBaseImgURL =
      "https://raw.githubusercontent.com/dearvoodoo/dbd/master/Perks/";

    // fetch the current perks in the shrine
    const shrinePerks = await fetch(
      "https://dbd-stats.info/api/shrineofsecrets?branch=live"
    ).then((response) => response.json());

    // create an embed to display the shrine perks to the user
    const shrineEmbed = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Shrine of Secrets")
      .setDescription(`Shrine ends in ${moment().to(shrinePerks.endDate)}`);

    // create the canvas to hold all images of the shrine perks
    const canvas = Canvas.createCanvas(1000, 250);

    const ctx = canvas.getContext("2d");

    let imageX = 0;

    // for each perk in shrine
    for (const perk of shrinePerks.items) {
      // add the name and cost in shards
      shrineEmbed.addField("\u200B", "\u200B");
      shrineEmbed.addField(perk.Name, `${perk.cost[0].price} Shards`);
      // load the perk image and add it to the canvas

      // find the name tag of the perk
      const perkInfo = await Perks.findOne({
        where: {
          name: perk.Name,
        },
      });

      // load the image
      const perkImage = await Canvas.loadImage(
        perkBaseImgURL + `${perkInfo.name_tag}.png`
      );
      ctx.drawImage(perkImage, imageX, 0, 250, 250);
      imageX += 250;
    }

    // attach the full shrine image to the embed
    const attachment = new Discord.MessageAttachment(
      canvas.toBuffer(),
      "shrinePerks.png"
    );

    shrineEmbed.attachFiles(attachment);

    message.channel.send(shrineEmbed);
  },
};
