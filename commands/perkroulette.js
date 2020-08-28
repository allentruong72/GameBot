const Canvas = require("canvas");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  name: "perkroulette",
  description: "Gets four random perks for survivor or killer",
  usage: "[killer or survivor]",
  async execute(message, args) {
    // only execute command if given a specific role for roulette
    if (!args.length) {
      message.reply(
        "You need to specify whether you want killer or survivor perks."
      );
    } else {
      // get the perk role for roulette either killer or survivor
      const perkRole = args[0].toLowerCase();

      // get a list of all perks
      const perkList = await fetch(
        "https://bridge.buddyweb.fr/api/dbd/perks"
      ).then((response) => response.text());

      // filter the perks by the perk role
      const filteredPerks = JSON.parse(perkList).filter(
        (perk) => perk.role.toLowerCase() === perkRole
      );

      const roulettePerks = new Set();

      // add random perks until four perks are found
      while (roulettePerks.size < 4) {
        const randomPerk =
          filteredPerks[Math.floor(Math.random() * filteredPerks.length)];
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
        roulettePerksEmbed.addField(perk.perk_name, "\u200B");
        // load the perk image and add it to the canvas
        const perkImage = await Canvas.loadImage(
          perkBaseImgURL + `${perk.perk_tag}.png`
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
