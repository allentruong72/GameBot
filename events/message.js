module.exports = (client, message) => {
  if (!message.content.startsWith(client.config.prefix) || message.author.bot)
    return;

  const args = message.content
    .slice(client.config.prefix.length)
    .trim()
    .split(/ +/);
  const command = args.shift().toLowerCase();

  if (!client.commands.has(command)) return;

  try {
    client.commands.get(command).execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute the command");
  }
};
