const Command = require("../../structures/Command");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const fs = require("fs");
let paginateContent = require("../../embeds/paginateContent.js")

module.exports = class GetProduct extends Command {
  constructor(client) {
    super(client, {
      name: "getproduct",
      description: client.cmdConfig.getproduct.description,
      usage: client.cmdConfig.getproduct.usage,
      permissions: client.cmdConfig.getproduct.permissions,
      aliases: client.cmdConfig.getproduct.aliases,
      category: "member",
      listed: client.cmdConfig.getproduct.enabled,
      slash: true,
      options: [{
        name: "id",
        description: "Product ID",
        type: "NUMBER",
        required: true
      }]
    });
  }

  async run(message, args) {
    let productList = yaml.load(fs.readFileSync('./configs/products.yml', 'utf8'));
    let option = args[0];
    if(!option || Number(option) > productList.products.length || Number(option) < 0 || isNaN(option)) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.getproduct.usage)]});
    option = parseInt(option - 1);

    let selectedProduct = productList.products[option];
    if(!selectedProduct)
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.products.invalid_product, this.client.embeds.error_color)] });
    
    if(selectedProduct.type == "NONE")
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.products.none_type, this.client.embeds.error_color)] });

    if(selectedProduct.roles.length > 0 && !this.client.utils.hasRole(this.client, message.guild, message.member, selectedProduct.roles)) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.products.roles.replace("<role>", selectedProduct.roles.map((x) => `<@&${x}>`).join(", ").trim()), this.client.embeds.error_color)] });
    if(this.client.utils.permissionsLength(message, message.member, selectedProduct.permissions) > 0) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.products.permissions, this.client.embeds.error_color)] });

    await this.client.utils.downloadProduct(this.client, message, option);
  }
  async slashRun(interaction, args) {
    await interaction.deferReply();
    let productList = yaml.load(fs.readFileSync('./configs/products.yml', 'utf8'));
    let option = interaction.options.getNumber("id");
    option = parseInt(option - 1);

    let selectedProduct = productList.products[option];
    if(!selectedProduct)
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.products.invalid_product, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.getproduct.ephemeral });

    if(selectedProduct.type == "NONE")
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.products.none_type, this.client.embeds.error_color)] });

    if(selectedProduct.roles.length > 0 && !this.client.utils.hasRole(this.client, interaction.guild, interaction.member, selectedProduct.roles)) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.products.roles.replace("<role>", selectedProduct.roles.map((x) => `<@&${x}>`).join(", ").trim()), this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.getproduct.ephemeral });
    if(this.client.utils.permissionsLength(interaction, interaction.member, selectedProduct.permissions) > 0) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.products.permissions, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.getproduct.ephemeral });

    await this.client.utils.downloadProduct(this.client, interaction, option);
  }
};