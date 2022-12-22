const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");
const { getTransaction } = require("../../utils/tebex");

module.exports = class TebexConnect extends Command {
  constructor(client) {
    super(client, {
      name: "tebexconnect",
      description: client.cmdConfig.tebexconnect.description,
      usage: client.cmdConfig.tebexconnect.usage,
      permissions: client.cmdConfig.tebexconnect.permissions,
      aliases: client.cmdConfig.tebexconnect.aliases,
      category: "mcstore",
      listed: client.cmdConfig.tebexconnect.enabled,
      slash: true,
      options: [{
        name: "transaction",
        description: "Transaction ID to Connect",
        type: "STRING",
        required: true
      }]
    });
  }

  async run(message, args) {
    let transactionId = args[0];
    let packagesApplied = [];
    let rolesObtained = [];

    if(!transactionId) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.tebexconnect.usage)] });

    let tebex = await getTransaction(this.client, transactionId);
    if(Array.isArray(tebex)) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.no_id, this.client.embeds.error_color)] });

    let tebexVerified = db.fetch(`tebexVerified_${message.guild.id}`) || [];
    if(tebexVerified.find((x) => x.key.toLowerCase() == transactionId.toLowerCase())) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.used_id, this.client.embeds.error_color)] });

    db.push(`tebexVerified_${message.guild.id}`, {
      userId: message.author.id,
      key: transactionId
    });

    if(this.client.config.tebex.separatePackages == true && this.client.config.tebex.packages.length > 0) {
      tebex.packages.forEach((tebexPack) => {
        let findPackage = this.client.config.tebex.packages.find((x) => x.id == tebexPack.id);
        if(!findPackage) return invalidPackages.push(tebexPack.id);
        if(findPackage.roles.length == 0) return;
        findPackage.roles.forEach(async(x) => {
          let findRole = this.client.utils.findRole(message.guild, x);
          if(findRole) rolesObtained.push(findRole);
          if(findRole) await message.member.roles.add(findRole).catch((err) => {});
        });
        packagesApplied.push(tebexPack.name);
      });
      if(rolesObtained.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.no_roles, this.client.embeds.error_color)] });
      if(packagesApplied.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.no_product, this.client.embeds.error_color)] });
    } else {
      if(this.client.config.tebex.roles.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.no_roles, this.client.embeds.error_color)] });
      packagesApplied.push("/");
      this.client.config.tebex.roles.forEach(async(x) => {
        let findRole = this.client.utils.findRole(message.guild, x);
        if(findRole) rolesObtained.push(findRole);
        if(findRole) await message.member.roles.add(findRole).catch((err) => {})
      });
    }

    message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.tebex.verified.replace("<packages>", `${packagesApplied.join(", ").trim()}`).replace("<roles>", rolesObtained.join(", ").trim()), this.client.embeds.success_color)] });
  }
  async slashRun(interaction, args) {
    let transactionId = interaction.options.getString("transaction");

    let packagesApplied = [];
    let rolesObtained = [];

    let tebex = await getTransaction(this.client, transactionId);
    if(Array.isArray(tebex)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.no_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
    
    let tebexVerified = db.fetch(`tebexVerified_${interaction.guild.id}`) || [];
    if(tebexVerified.find((x) => x.key.toLowerCase() == transactionId.toLowerCase())) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.used_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
    
    db.push(`tebexVerified_${interaction.guild.id}`, {
      userId: interaction.user.id,
      key: transactionId
    });

    if(this.client.config.tebex.separatePackages == true && this.client.config.tebex.packages.length > 0) {
      tebex.packages.forEach((tebexPack) => {
        let findPackage = this.client.config.tebex.packages.find((x) => x.id == tebexPack.id);
        if(!findPackage) return invalidPackages.push(tebexPack.id);
        if(findPackage.roles.length == 0) return;
        findPackage.roles.forEach(async(x) => {
          let findRole = this.client.utils.findRole(message.guild, x);
          if(findRole) rolesObtained.push(findRole);
          if(findRole) await interaction.member.roles.add(findRole).catch((err) => {});
        });
        packagesApplied.push(tebexPack.name);
      });
      if(rolesObtained.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.no_roles, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
      if(packagesApplied.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.no_product, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
    } else {
      if(this.client.config.tebex.roles.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.no_roles, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
      packagesApplied.push('/');
      this.client.config.tebex.roles.forEach(async(x) => {
        let findRole = this.client.utils.findRole(interaction.guild, x);
        if(findRole) rolesObtained.push(findRole);
        if(findRole) await interaction.member.roles.add(findRole).catch((err) => {})
      });
    }
    
    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.tebex.verified.replace("<packages>", `${packagesApplied.join(", ").trim()}`).replace("<roles>", rolesObtained.join(", ").trim()), this.client.embeds.success_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
  }
};