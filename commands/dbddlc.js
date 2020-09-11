const Discord = require("discord.js");
const { DLC, Users } = require("../dbObjects");
module.exports = {
  name: "dbddlc",
  description: "lists all DBD DLC and also lets you add DLC to your collection",
  usage:
    "\n[no args] (lists all DBD DLC)\n[owned (no args or @user)] (lists all DBD DLC you or another user owns)\n[add (DLC ID/name/app_id)] (adds a DLC)\n[remove (DLC ID/name/app_id)] (removes a DLC)",
  async execute(message, args) {
    if (!args.length) {
      const dlcList = await DLC.findAll();
      generateDLCList(dlcList, message);
    } else {
      // get mentioned user or the message author
      const targetUser = message.mentions.users.first() || message.author;

      // get user from database
      let user = await Users.findOne({
        where: { user_id: targetUser.id },
      });

      // get user input
      const userInput = args[1];

      // different subcommands for dbddlc
      switch (args[0].toLowerCase()) {
        // gets owned dlc for a user or mentioned user
        case "owned": {
          // check for user in User table
          if (user) {
            const userDLCs = await user.getDLCs();
            // check if user owns any DLC in UserDLCs table
            if (!userDLCs.length)
              return message.channel.send(
                `${targetUser} does not own any DLCs`
              );

            // get only the DLCs that the user currently owns
            const dlcList = userDLCs.map((userDLC) => userDLC.dlc);

            // create an embed of all DLCs the target user owns
            generateDLCList(dlcList, message, targetUser);
          } else {
            message.channel.send(`${targetUser} does not own any DLCs`);
          }
          break;
        }
        case "add": {
          if (userInput) {
            // find dlc in DLC table based on user input
            const addDLC = await DLC.findDLC(userInput);

            if (!user) {
              // add the user to the Users table
              user = await Users.create({ user_id: targetUser.id });
            }

            // add the user's id and dlc to the UserDLCs table
            try {
              await user.addDLC(addDLC);
            } catch (SequelizeUniqueConstraintError) {
              return message.reply(
                `You already own ${addDLC.name} in your collection.`
              );
            }

            message.reply(`You have added ${addDLC.name} to your collection.`);
          } else {
            message.reply("Please specify the DLC you want to add.");
          }
          break;
        }
        case "remove": {
          if (userInput) {
            if (user) {
              // get DLC from DLC table
              const removeDLC = await DLC.findDLC(userInput);

              // remove DLC from UserDLCs using user id
              await user.removeDLC(removeDLC);

              message.reply(
                `You have removed ${removeDLC.name} from your collection.`
              );
            } else {
              return message.channel.send(
                `${targetUser} does not own any DLCs.`
              );
            }
          } else {
            return message.reply("Please specify the DLC you want to remove.");
          }
          break;
        }
      }
    }
  },
};

// creates a list of embeds of five DLC per page from a list of DLCs
function generateDLCEmbed(dlclist, user = "") {
  const embeds = [];
  // current last position of a DLC
  let k = 5;
  for (let i = 0; i < dlclist.length; i += 5) {
    // gets five DLCs from the DLC list
    const current = dlclist.slice(i, k);
    let j = i;
    // gets the next last position of DLCs
    k += 5;
    // creates a string which shows DLC name and DLC app id
    const info = current
      .map(
        (dlc) =>
          `${++j}) ID: ${dlc.id}, Name: ${dlc.name}, AppID: ${dlc.app_id}\n`
      )
      .join("\n");
    // creates a page embed of 5 DLCs and adds it to the total embed list
    const embed = new Discord.MessageEmbed().setDescription(`${info}`);

    // sets title depending if there is a user or not
    if (user) {
      embed.setTitle(`${user.username}'s list of owned DLCs`);
    } else {
      embed.setTitle("Dead by Daylight DLCs");
    }
    embeds.push(embed);
  }

  return embeds;
}

async function generateDLCList(dlcList, message, targetUser = "") {
  // tracks current page user is on
  let currentPage = 0;

  // creates a list of embeds
  const dlcListEmbeds = generateDLCEmbed(dlcList, targetUser);

  // creates an embedded message to display the DLCs
  const dlcEmbedMessage = {
    content: `Current Page: ${currentPage + 1}/${dlcListEmbeds.length}\n`,
    embed: dlcListEmbeds[currentPage],
  };

  const dlcEmbed = await message.channel.send(dlcEmbedMessage);

  await dlcEmbed.react("⬅️");
  await dlcEmbed.react("➡️");

  // filters the reaction to only include the listed emojis when a user reacts
  const filter = (reaction, user) =>
    ["⬅️", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;

  const collector = dlcEmbed.createReactionCollector(filter);

  // when the user reacts
  collector.on("collect", (reaction) => {
    // checks if the user reacts with the right arrow
    if (reaction.emoji.name === "➡️") {
      // checks to see if the current page is not on the last page
      if (currentPage < dlcListEmbeds.length - 1) {
        // increments current page and edits the message to show the next DLC embed
        currentPage++;
        dlcEmbedMessage.content = `Current Page: ${currentPage + 1}/${
          dlcListEmbeds.length
        }\n`;
        dlcEmbedMessage.embed = dlcListEmbeds[currentPage];
        dlcEmbed.edit(dlcEmbedMessage);
      }
      // checks if the user reacts with the left arrow
    } else if (reaction.emoji.name === "⬅️") {
      // checks to see that the current page is not currently on the first page
      if (currentPage !== 0) {
        // decrements current page and edits message to show the previos DLC embed
        currentPage--;
        dlcEmbedMessage.content = `Current Page: ${currentPage + 1}/${
          dlcListEmbeds.length
        }\n`;
        dlcEmbedMessage.embed = dlcListEmbeds[currentPage];
        dlcEmbed.edit(dlcEmbedMessage);
      }
    }
  });
}
