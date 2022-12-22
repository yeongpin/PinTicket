const Command = require("../../structures/Command");
const db = require("quick.db");

module.exports = class Notes extends Command {
  constructor(client) {
    super(client, {
      name: "notes",
      description: client.cmdConfig.notes.description,
      usage: client.cmdConfig.notes.usage,
      permissions: client.cmdConfig.notes.permissions,
      aliases: client.cmdConfig.notes.aliases,
      category: "service",
      listed: client.cmdConfig.notes.enabled,
      slash: true,
      options: [{
        name: "note",
        type: "STRING",
        description: "Note Text",
        required: false,
      }]
    });
  }

  async run(message, args) {
    let notes = args.join(" ");
    let option = db.fetch(`notes_${message.channel.id}`);

    if(args[0]) {
      db.set(`notes_${message.channel.id}`, notes);
      message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.note_added.replace("<note>", notes), this.client.embeds.success_color)] });
    } else {
      if(!option || option == null) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
      db.delete(`notes_${message.channel.id}`);
      message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.note_reseted, this.client.embeds.success_color)] });
    }
  }
  
  async slashRun(interaction, args) {
    let notes = interaction.options.getString("note") || "";
    let option = db.fetch(`notes_${interaction.channel.id}`);

    if(notes.length > 6) {
      db.set(`notes_${interaction.channel.id}`, notes);
      interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.note_added.replace("<note>", notes), this.client.embeds.success_color)] });
    } else {
      if(!option || option == null) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
      db.delete(`notes_${interaction.channel.id}`);
      interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.note_reseted, this.client.embeds.success_color)] });
    }
  }
};