const Command = require("../../structures/Command");
const db = require("quick.db");

module.exports = class Claim extends Command {
	constructor(client) {
		super(client, {
			name: "claim",
			description: client.cmdConfig.claim.description,
			usage: client.cmdConfig.claim.usage,
			permissions: client.cmdConfig.claim.permissions,
      aliases: client.cmdConfig.claim.aliases,
			category: "tickets",
			listed: true,
			slash: true,
		});
	}
  
  async run(message, args) {
    let config = this.client.config;
    let claimed = db.fetch(`ticketClaimed_${message.channel.id}`);

    if (!this.client.utils.isTicket(this.client, message.channel)) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });

    if(claimed != null) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.already_claimed, this.client.embeds.error_color)] });

    message.channel.permissionOverwrites.edit(message.member.user, {
      SEND_MESSAGES: true,
      VIEW_CHANNEL: true,
    });

    if(config.roles.support.length > 0) {
      for(let i = 0; i < config.roles.support.length; i++) {
        let findRole = this.client.utils.findRole(message.guild, config.roles.support[i]);
        message.channel.permissionOverwrites.edit(findRole, {
          SEND_MESSAGES: false,
          VIEW_CHANNEL: true,
        });
      }
    }

    db.set(`ticketClaimed_${message.channel.id}`, message.author.id);
    db.add(`claimedTickets_${message.guild.id}`, 1);
    db.add(`claimedStats_${message.author.id}`, 1);
    db.delete(`autoClaim_${message.channel.id}`);
    message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.ticket_claimed.replace("<user>", message.author), this.client.embeds.success_color)] }).then(() => message.delete());
  }
	async slashRun(interaction, args) {
    let config = this.client.config;
    let claimed = db.fetch(`ticketClaimed_${interaction.channel.id}`);

    if (!this.client.utils.isTicket(this.client, interaction.channel)) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });

    if(claimed != null) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.already_claimed, this.client.embeds.error_color)] });

    interaction.channel.permissionOverwrites.edit(interaction.user, {
      SEND_MESSAGES: true,
      VIEW_CHANNEL: true,
    });

    if(config.roles.support.length > 0) {
      for(let i = 0; i < config.roles.support.length; i++) {
        let findRole = this.client.utils.findRole(interaction.guild, config.roles.support[i]);
        interaction.channel.permissionOverwrites.edit(findRole, {
          SEND_MESSAGES: false,
          VIEW_CHANNEL: true,
        });
      }
    }

    db.set(`ticketClaimed_${interaction.channel.id}`, interaction.user.id);
    db.add(`claimedTickets_${interaction.guild.id}`, 1);
    db.add(`claimedStats_${interaction.user.id}`, 1);
    db.delete(`autoClaim_${interaction.channel.id}`);
    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.ticket_claimed.replace("<user>", interaction.user), this.client.embeds.success_color)] });
	}
};