const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");

module.exports = class Add extends Command {
	constructor(client) {
		super(client, {
			name: "add",
			description: client.cmdConfig.add.description,
			usage: client.cmdConfig.add.usage,
			permissions: client.cmdConfig.add.permissions,
      aliases: client.cmdConfig.add.aliases,
			category: "tickets",
			listed: client.cmdConfig.add.enabled,
      slash: true,
      options: [{
        name: 'user',
        type: 'USER',
        description: "User to add to Ticket",
        required: true,
      }]
		});
	}
  
  async run(message, args) {
    let config = this.client.config;

    if (!this.client.utils.isTicket(this.client, message.channel)) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });
    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if(!member) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.add.usage)] });
    
    message.guild.channels.cache.get(message.channel.id).permissionOverwrites.create(member.id, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
    
    const added = new Discord.MessageEmbed()
      .setTitle(this.client.embeds.title)
      .setDescription(this.client.language.ticket.user_added.replace("<user>", member))
      .setFooter({ text: this.client.embeds.footer, iconURL: this.client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()
      .setColor(this.client.embeds.success_color);
    
    message.channel.send({ embeds: [added] });
  }
  async slashRun(interaction, args) {
    let config = this.client.config;
    let member = interaction.options.getUser("user");

    if (!this.client.utils.isTicket(this.client, interaction.channel)) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });
    
    interaction.guild.channels.cache.get(interaction.channel.id).permissionOverwrites.create(member.id, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
    
    const added = new Discord.MessageEmbed()
      .setTitle(this.client.embeds.title)
      .setDescription(this.client.language.ticket.user_added.replace("<user>", member))
      .setFooter({ text: this.client.embeds.footer, iconURL: this.client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()
      .setColor(this.client.embeds.success_color);
    
    interaction.reply({ embeds: [added] });
  }
};