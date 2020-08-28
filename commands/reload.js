module.exports = {
  name: "reload",
  description: "reloads a command",
  usage: "[command name]",
  execute(message, args) {
    const commandName = args[0].toLowerCase();
    const command =
      message.client.commands.get(commandName) ||
      message.client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command)
      return message.reply(
        `There is no command with name or alias \`${commandName}\`.`
      );

    delete require.cache[require.resolve(`./${command.name}.js`)];
    message.client.commands.delete(command.name);

    try {
      const newCommand = require(`./${command.name}.js`);
      message.client.commands.set(newCommand.name, newCommand);
      message.reply(`The command ${command.name} has been reloaded`);
    } catch (error) {
      console.log(error);
      message.reply(`There was an error trying to reload ${commandName}`);
    }
  },
};
