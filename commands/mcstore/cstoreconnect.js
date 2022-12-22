const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");
const { getPayment } = require("../../utils/craftingStore");

module.exports = class CraftingStoreConnect extends Command {
  constructor(client) {
    super(client, {
      name: "cstoreconnect",
      description: client.cmdConfig.cstoreconnect.description,
      usage: client.cmdConfig.cstoreconnect.usage,
      permissions: client.cmdConfig.cstoreconnect.permissions,
      aliases: client.cmdConfig.cstoreconnect.aliases,
      category: "mcstore",
      listed: client.cmdConfig.cstoreconnect.enabled,
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

    if(!transactionId) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.cstoreconnect.usage)] });

    let cstore = await getPayment(this.client, transactionId);
    if(!cstore) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.no_id, this.client.embeds.error_color)] });

    let craftingVerified = db.fetch(`craftingVerified_${message.guild.id}`) || [];
    if(craftingVerified.find((x) => x.key.toLowerCase() == transactionId.toLowerCase())) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.used_id, this.client.embeds.error_color)] });

    db.push(`craftingVerified_${message.guild.id}`, {
      userId: message.author.id,
      key: transactionId
    });

    if(this.client.config.cstore.separatePackages == true && this.client.config.cstore.packages.length > 0) {
      let splitPackages = cstore.packageName.split(","); // ['Prvi', 'Drugi']
      splitPackages.forEach((cstorePack) => {
        let findPackage = this.client.config.cstore.packages.find((x) => cstorePack.name.toLowerCase().includes(x.toLowerCase()));
        if(!findPackage) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.no_package, this.client.embeds.error_color)] });
        if(findPackage.roles.length == 0) return;
        findPackage.roles.forEach(async(x) => {
          let findRole = this.client.utils.findRole(message.guild, x);
          if(findRole) rolesObtained.push(findRole);
          if(findRole) await message.member.roles.add(findRole).catch((err) => {});
        });
        packagesApplied.push(cstorePack.name.trim());
      });
      if(rolesObtained.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.no_roles, this.client.embeds.error_color)] });
      if(packagesApplied.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.no_product, this.client.embeds.error_color)] });
    } else {
      if(this.client.config.cstore.roles.length == 0) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.no_roles, this.client.embeds.error_color)] });
      packagesApplied.push("/");
      this.client.config.cstore.roles.forEach(async(x) => {
        let findRole = this.client.utils.findRole(message.guild, x);
        if(findRole) rolesObtained.push(findRole);
        if(findRole) await message.member.roles.add(findRole).catch((err) => {})
      });
    }

    message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.cstore.verified.replace("<packages>", `${packagesApplied.join(", ").trim()}`).replace("<roles>", rolesObtained.join(", ").trim()), this.client.embeds.success_color)] });
  }
  async slashRun(interaction, args) {
    let transactionId = interaction.options.getString("transaction");

    let packagesApplied = [];
    let rolesObtained = [];

    let cstore = await getPayment(this.client, transactionId);
    if(!cstore) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.no_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
    
    let craftingVerified = db.fetch(`craftingVerified_${interaction.guild.id}`) || [];
    if(craftingVerified.find((x) => x.key.toLowerCase() == transactionId.toLowerCase())) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.used_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.cstoreconnect.ephemeral });
    
    db.push(`craftingVerified_${interaction.guild.id}`, {
      userId: interaction.user.id,
      key: transactionId
    });

    if(this.client.config.cstore.separatePackages == true && this.client.config.cstore.packages.length > 0) {
      let splitPackages = cstore.packageName.split(",");
      splitPackages.forEach((cstorePack) => {
        let findPackage = this.client.config.cstore.packages.find((x) => cstorePack.name.toLowerCase().includes(x.toLowerCase()));
        if(!findPackage) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.no_package, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
        if(findPackage.roles.length == 0) return;
        findPackage.roles.forEach(async(x) => {
          let findRole = this.client.utils.findRole(interaction.guild, x);
          if(findRole) rolesObtained.push(findRole);
          if(findRole) await interaction.member.roles.add(findRole).catch((err) => {});
        });
        packagesApplied.push(cstorePack.name.trim());
      });
      if(rolesObtained.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.no_roles, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
      if(packagesApplied.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.no_product, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.tebexconnect.ephemeral });
    } else {
      if(this.client.config.cstore.roles.length == 0) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.no_roles, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.cstoreconnect.ephemeral });
      packagesApplied.push('/');
      this.client.config.cstore.roles.forEach(async(x) => {
        let findRole = this.client.utils.findRole(interaction.guild, x);
        if(findRole) rolesObtained.push(findRole);
        if(findRole) await interaction.member.roles.add(findRole).catch((err) => {})
      });
    }
    
    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.cstore.verified.replace("<packages>", `${packagesApplied.join(", ").trim()}`).replace("<roles>", rolesObtained.join(", ").trim()), this.client.embeds.success_color)], ephemeral: this.client.cmdConfig.cstoreconnect.ephemeral });
  }
};