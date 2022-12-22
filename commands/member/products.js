const Command = require("../../structures/Command");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const fs = require("fs");
let paginateContent = require("../../embeds/paginateContent.js")

module.exports = class Products extends Command {
  constructor(client) {
    super(client, {
      name: "products",
      description: client.cmdConfig.products.description,
      usage: client.cmdConfig.products.usage,
      permissions: client.cmdConfig.products.permissions,
      aliases: client.cmdConfig.products.aliases,
      category: "member",
      listed: client.cmdConfig.products.enabled,
      slash: true,
    });
  }

  async run(message, args) {
    let productList = yaml.load(fs.readFileSync('./configs/products.yml', 'utf8'));
    let productArray = [];
    let format = this.client.config.products.format;
    for(let i = 0; i < productList.products.length; i++) {
      productArray.push(format.replace("[ID]", `${i + 1}`)
        .replace("[NAME]", `${productList.products[i].name}`)
        .replace("[TYPE]", `${productList.products[i].type}`)
        .replace("[DESCRIPTION]", `${productList.products[i].description}`))
    }

    paginateContent(this.client, productArray, 10, 1, message, this.client.language.titles.products, this.client.embeds.general_color);
  }
  async slashRun(interaction, args) {
    let productList = yaml.load(fs.readFileSync('./configs/products.yml', 'utf8'));
    let productArray = [];
    let format = this.client.config.products.format;
    for(let i = 0; i < productList.products.length; i++) {
      productArray.push(format.replace("[ID]", `${i + 1}`)
        .replace("[NAME]", `${productList.products[i].name}`)
        .replace("[TYPE]", `${productList.products[i].type}`)
        .replace("[DESCRIPTION]", `${productList.products[i].description}`))
    }

    paginateContent(this.client, productArray, 10, 1, interaction, this.client.language.titles.products, this.client.embeds.general_color);
  }
};