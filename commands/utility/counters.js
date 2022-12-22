const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db")

module.exports = class Counters extends Command {
  constructor(client) {
    super(client, {
      name: "counters",
      description: client.cmdConfig.counters.description,
      usage: client.cmdConfig.counters.usage,
      permissions: client.cmdConfig.counters.permissions,
      aliases: client.cmdConfig.counters.aliases,
      category: "utility",
      listed: client.cmdConfig.counters.enabled,
      slash: true,
    });
  }

  async run(message, args) {
    let config = this.client.config;

    let currentTickets = [...message.guild.channels.cache.filter(c => c.name.startsWith(this.client.config.channels.channel_name)).values()].length;
    let totalTickets = db.fetch(`ticket_${message.guild.id}`) || 0;
    let claimedTickets = db.fetch(`claimedTickets_${message.guild.id}`) || 0;

    let m = await message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.utility.counters_started, this.client.embeds.general_color)] });

    let chCategory = await message.guild.channels.create(this.client.language.utility.counters_category, {
      type: 'GUILD_CATEGORY',
    });
    
    if(config.general.stats_type != "GUILD_VOICE" && config.general.stats_type != "GUILD_TEXT") return this.client.utils.sendError("Provided Channel Type for Counters (stats_type) is invalid. Valid types: GUILD_VOICE, GUILD_TEXT.")

    let chOpened = await message.guild.channels.create(`${this.client.language.utility.opened_counter.replace("<stats>", currentTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });
    let chTotal = await message.guild.channels.create(`${this.client.language.utility.total_counter.replace("<stats>", totalTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });
    let chClaimed = await message.guild.channels.create(`${this.client.language.utility.claimed_counter.replace("<stats>", claimedTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });

    await db.set(`openedChannel_${message.guild.id}`, chOpened.id);
    await db.set(`totalChannel_${message.guild.id}`, chTotal.id);
    await db.set(`claimedChannel_${message.guild.id}`, chClaimed.id);

    await m.edit({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.utility.counters_created, this.client.embeds.general_color)] });
  }
  async slashRun(interaction, args) {
    let config = this.client.config;
  
    let currentTickets = [...interaction.guild.channels.cache.filter(c => c.name.startsWith(this.client.config.channels.channel_name)).values()].length;
    let totalTickets = db.fetch(`ticket_${interaction.guild.id}`) || 0;
    let claimedTickets = db.fetch(`claimedTickets_${interaction.guild.id}`) || 0;

    let m = await interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.utility.counters_started, this.client.embeds.general_color)] });
  
    let chCategory = await interaction.guild.channels.create(this.client.language.utility.counters_category, {
      type: 'GUILD_CATEGORY',
    });

    let chOpened = await interaction.guild.channels.create(`${this.client.language.utility.opened_counter.replace("<stats>", currentTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });
    let chTotal = await interaction.guild.channels.create(`${this.client.language.utility.total_counter.replace("<stats>", totalTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });
    let chClaimed = await interaction.guild.channels.create(`${this.client.language.utility.claimed_counter.replace("<stats>", claimedTickets)}`, {
      type: config.general.stats_type,
      parent: chCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: ['CONNECT']
        }
      ]
    });
  
    await db.set(`openedChannel_${interaction.guild.id}`, chOpened.id);
    await db.set(`totalChannel_${interaction.guild.id}`, chTotal.id);
    await db.set(`claimedChannel_${interaction.guild.id}`, chClaimed.id);
  
    await m.editReply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.utility.counters_created, this.client.embeds.general_color)] });
  }
};
