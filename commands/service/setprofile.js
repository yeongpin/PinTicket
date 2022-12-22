const Command = require("../../structures/Command");
const db = require("quick.db");

module.exports = class SetProfile extends Command {
  constructor(client) {
    super(client, {
      name: "setprofile",
      description: client.cmdConfig.setprofile.description,
      usage: client.cmdConfig.setprofile.usage,
      permissions: client.cmdConfig.setprofile.permissions,
      aliases: client.cmdConfig.setprofile.aliases,
      category: "service",
      listed: client.cmdConfig.setprofile.enabled,
      slash: true,
      options: [{
        name: "paypal",
        type: "SUB_COMMAND",
        description: "Set your PayPal for Profile",
        options: [{
          name: "mail",
          type: "STRING",
          description: "PayPal Mail",
          required: false,
        }]
      },{
        name: "hours",
        type: "SUB_COMMAND",
        description: "Set your Available Hours for Profile",
        options: [{
          name: "hours",
          type: "STRING",
          description: "Available Hours",
          required: false,
        }]
      },{
        name: "bio",
        type: "SUB_COMMAND",
        description: "Set your Bio for Profile",
        options: [{
          name: "bio",
          type: "STRING",
          description: "Bio Text, use '/n' for new line",
          required: false,
        }]
      }]
    });
  }

  async run(message, args) {
    let option = args[0];
    if(!option) return;
    let value = args.slice(1).join(" ");

    if(option.toLowerCase() == "hours") {
      let hours = db.fetch(`availableHours_${message.author.id}`);
      if(args[1]) {
        db.set(`availableHours_${message.author.id}`, value);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.hours_added.replace("<hours>", value), this.client.embeds.success_color)] });
      } else {
        if(!hours || hours == null) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`availableHours_${message.author.id}`);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.hours_reseted, this.client.embeds.success_color)] });
      }
    } else if(option.toLowerCase() == "paypal") {
      let paypal = db.fetch(`paypal_${message.author.id}`);
      if(args[1]) {
        if(!value.includes("@")) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.language.titles.error, this.client.language.service.invalid_mail, this.client.embeds.error_color )] });
        db.set(`paypal_${message.author.id}`, value);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.paypal_added.replace("<paypal>", value), this.client.embeds.success_color)] });
      } else {
        if(!paypal || paypal == null) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`paypal_${message.author.id}`);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.paypal_reseted, this.client.embeds.success_color)] });
      }
    } else if(option.toLowerCase() == "bio") {
      let bio = db.fetch(`bio_${message.guild.id}_${message.author.id}`);
      if(args[1]) {
        if(value.length >= this.client.config.general.bio_limit) value = value.slice(0, Number(this.client.config.general.bio_limit - 3)) + '...';
        db.set(`bio_${message.guild.id}_${message.author.id}`, value);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.bio_added.replace("<bio>", value), this.client.embeds.success_color)] });
      } else {
        if(!bio || bio == null) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`bio_${message.guild.id}_${message.author.id}`);
        message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.bio_reseted, this.client.embeds.success_color)] });
      }
    } else {
      message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.setprofile.usage)] }); 
    }
  }
  async slashRun(interaction, args) {
    let option = args[0];
    let value = args[1];
  
    if(option.toLowerCase() == "hours") {
      let hours = db.fetch(`availableHours_${interaction.user.id}`);
      if(args[1]) {
        db.set(`availableHours_${interaction.user.id}`, value);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.hours_added.replace("<hours>", value), this.client.embeds.success_color)] });
      } else {
        if(!hours || hours == null) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`availableHours_${interaction.user.id}`);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.hours_reseted, this.client.embeds.success_color)] });
      }
    } else if(option.toLowerCase() == "paypal") {
      let paypal = db.fetch(`paypal_${interaction.user.id}`);
      if(args[1]) {
        if(!value.includes("@")) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.language.titles.error, this.client.language.service.invalid_mail, this.client.embeds.error_color )] });
        db.set(`paypal_${interaction.user.id}`, value);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.paypal_added.replace("<paypal>", value), this.client.embeds.success_color)] });
      } else {
        if(!paypal || paypal == null) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`paypal_${interaction.user.id}`);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.paypal_reseted, this.client.embeds.success_color)] });
      }
    } else if(option.toLowerCase() == "bio") {
      let bio = db.fetch(`bio_${interaction.guild.id}_${interaction.user.id}`);
      if(args[1]) {
        if(value.length >= this.client.config.general.bio_limit) value = value.slice(0, Number(this.client.config.general.bio_limit - 3)) + '...';
        db.set(`bio_${interaction.guild.id}_${interaction.user.id}`, value);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.bio_added.replace("<bio>", value), this.client.embeds.success_color)] });
      } else {
        if(!bio || bio == null) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.not_set, this.client.embeds.error_color)] });
        db.delete(`bio_${interaction.guild.id}_${interaction.user.id}`);
        interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.bio_reseted, this.client.embeds.success_color)] });
      }
    }
  }
};