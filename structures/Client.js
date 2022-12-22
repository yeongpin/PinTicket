const { Client, Intents, Collection } = require("discord.js");
const yaml = require('js-yaml');
const fs = require("fs");

module.exports = class BotClient extends Client {
  constructor() {
    const myIntents = new Intents();
    myIntents.add(
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_BANS,
      Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Intents.FLAGS.GUILD_INVITES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_PRESENCES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    );

    super({ intents: myIntents, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']});
    
    // Files //
    
    this.config = yaml.load(fs.readFileSync('./configs/config.yml', 'utf8'));
    this.language = yaml.load(fs.readFileSync('./configs/language.yml', 'utf8'));
    this.cmdConfig = yaml.load(fs.readFileSync('./configs/commands.yml', 'utf8'));
    this.embeds = yaml.load(fs.readFileSync('./configs/embeds.yml', 'utf8'));
    this.utils = require("../utils/utils.js");
    this.embedBuilder = require("../embeds/embedBuilder.js");

    // Other //
    
    this.db = require("quick.db");
    
    this.aliases = new Collection();
    this.commands = new Collection();
    this.slashCommands = new Collection();
    this.slashArray = [];
    this.addonList = [];
  }
  async login(token = this.token) {
    super.login(token);
  }
}