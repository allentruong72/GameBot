module.exports = (client, message) => {
  if (!message.content.startsWith(client.config.prefix) || message.author.bot)
    return;

  const args = message.content
    .slice(client.config.prefix.length)
    .trim()
    .split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  if (command.args && !args.length) {
    message.channel.send(`You didn't provide any arguments, ${message.author}`);
  }

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute the command");
  }
};
