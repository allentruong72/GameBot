const fs = require("fs");
const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client();
client.config = config;
client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  const eventName = file.split(".")[0];
  client.on(eventName, event.bind(null, client));
  delete require.cache[require.resolve(`./events/${file}`)];
}

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.login(config.token);
