module.exports = {
  name: "reload",
  description: "reloads a command",
  execute(message, args) {
    const commandName = args[0].toLowerCase();
    const command =
      message.client.get(commandName) ||
      message.client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command)
      return message.reply(
        `There is no command with name or alias \`${commandName}\`.`
      );

    delete require.cache[require.resolve(`./${commandName}.js`)];
    message.client.commands.delete(commandName);

    try {
      const newCommand = require(`./${commandName}.js`);
      message.client.commands.set(newCommand.name, newCommand);
      message.reply(`The command ${commandName} has been reloaded`);
    } catch (error) {
      console.log(error);
      message.reply(`There was an error trying to reload ${commandName}`);
    }
  },
};
