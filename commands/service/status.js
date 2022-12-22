const Command = require("../../structures/Command");
const db = require("quick.db");

module.exports = class Status extends Command {
  constructor(client) {
    super(client, {
      name: "status",
      description: client.cmdConfig.status.description,
      usage: client.cmdConfig.status.usage,
      permissions: client.cmdConfig.status.permissions,
      aliases: client.cmdConfig.status.aliases,
      category: "service",
      listed: client.cmdConfig.status.enabled,
      slash: true
    });
  }

  async run(message, args) {
    let away = db.fetch(`status_${message.author.id}`);

    if(away == null || !away) {
      db.set(`status_${message.author.id}`, 1);
      message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.status.replace("<status>", this.client.language.service.availability.unavailable), this.client.embeds.success_color)] });
    } else if(away == 1) {
      db.delete(`status_${message.author.id}`);
      message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.status.replace("<status>", this.client.language.service.availability.available), this.client.embeds.success_color)] });
    }
  }
  async slashRun(interaction, args) {
    let away = db.fetch(`status_${interaction.user.id}`);

    if(away == null || !away) {
      db.set(`status_${interaction.user.id}`, 1);
      interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.status.replace("<status>", this.client.language.service.availability.unavailable), this.client.embeds.success_color)] });
    } else if(away == 1) {
      db.delete(`status_${interaction.user.id}`);
      interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.status.replace("<status>", this.client.language.service.availability.available), this.client.embeds.success_color)] });
    }
  }
};