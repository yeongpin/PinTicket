const Command = require("../../structures/Command");
const db = require("quick.db");
const { textTranscript, htmlTranscript } = require("../../utils/createTranscript.js");
const askReview = require("../../utils/askReview.js");

module.exports = class Close extends Command {
	constructor(client) {
		super(client, {
			name: "close",
			description: client.cmdConfig.close.description,
			usage: client.cmdConfig.close.usage,
			permissions: client.cmdConfig.close.permissions,
			aliases: client.cmdConfig.close.aliases,
			category: "tickets",
			listed: client.cmdConfig.close.enabled,
			slash: true,
		});
	}
  
  async run(message, args) {
    const config = this.client.config;
		const language = this.client.language;

    if (!this.client.utils.isTicket(this.client, message.channel)) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });
		let ticketID = db.fetch(`ticket_${message.guild.id}`);
		if(config.general.confirm_close == false) {
			message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.member.user, this.client.embeds.title, language.ticket.ticket_deleted, this.client.embeds.general_color)] });
			await askReview(this.client, message.channel, message.guild);
			if(config.general.transcripts == true) {
				if(config.general.transcript_type == "HTML") {
					await htmlTranscript(this.client, message, `ticket-${ticketID}`, message);
				} else {
					await textTranscript(this.client, message, ticketID, message);
				}
				setTimeout(() => {
					let dataRemove = db
						.all()
						.filter((i) => i.ID.includes(message.channel.id));
					dataRemove.forEach((x) => db.delete(x.ID));
				}, 5000);
			} else {
				let dataRemove = db
					.all()
					.filter((i) => i.ID.includes(message.channel.id));
				dataRemove.forEach((x) => db.delete(x.ID));
				setTimeout(async() => {
					message.channel.delete();
				}, this.client.config.general.delete_after * 1000);
			}
			return;
		}
  
    this.client.emit("ticketClose", message, message.member);
  }
	async slashRun(interaction, args) {
		const config = this.client.config;
		const language = this.client.language;

    if (!this.client.utils.isTicket(this.client, interaction.channel)) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });
		let ticketID = db.fetch(`ticket_${interaction.guild.id}`);
		if(config.general.confirm_close == false) {
			interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, language.ticket.ticket_deleted, this.client.embeds.general_color)] });
			await askReview(this.client, message.channel, interaction.guild);
			if(config.general.transcripts == true) {
				if(config.general.transcript_type == "HTML") {
					await htmlTranscript(this.client, interaction, `ticket-${ticketID}`, interaction);
				} else {
					await textTranscript(this.client, interaction, ticketID, interaction);
				}
				setTimeout(() => {
					let dataRemove = db
						.all()
						.filter((i) => i.ID.includes(interaction.channel.id));
		
					dataRemove.forEach((x) => db.delete(x.ID));
				}, 5000);
			} else {
				//await askReview(this.client, message.channel, interaction.guild);
				let dataRemove = db
					.all()
					.filter((i) => i.ID.includes(interaction.channel.id));

				dataRemove.forEach((x) => db.delete(x.ID));
				setTimeout(async() => {
					interaction.channel.delete();
				}, this.client.config.general.delete_after * 1000);
			}
			return;
		}
    this.client.emit("ticketClose", interaction, interaction.member);
	}
};