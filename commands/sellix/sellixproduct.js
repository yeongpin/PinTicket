const Command = require("../../structures/Command");
const Discord = require("discord.js");
const { getProduct } = require("../../utils/sellix");

module.exports = class SellixProduct extends Command {
  constructor(client) {
    super(client, {
      name: "sellixproduct",
      description: client.cmdConfig.sellixproduct.description,
      usage: client.cmdConfig.sellixproduct.usage,
      permissions: client.cmdConfig.sellixproduct.permissions,
      aliases: client.cmdConfig.sellixproduct.aliases,
      category: "sellix",
      listed: client.cmdConfig.sellixproduct.enabled,
      slash: true,
    });
  }

  async run(message, args) {
    let productId = args[0];

    if(!productId) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.sellixproduct.usage)] });

    let product = await getProduct(this.client, productId);
    if(!product) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");
    if(product.status != 200) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.sellix.no_id, this.client.embeds.error_color)] });

    let productEmbed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.sellixProduct.color);

    if(this.client.embeds.sellixProduct.title) productEmbed.setTitle(this.client.embeds.sellixProduct.title);
    let field = this.client.embeds.sellixProduct.fields;
    for(let i = 0; i < this.client.embeds.sellixProduct.fields.length; i++) {
      productEmbed.addField(field[i].title, field[i].description.replace("<name>", product.data.product.title)
        .replace("<description>", product.data.product.description)
        .replace("<price>", product.data.product.price)
        .replace("<stock>", product.data.product.stock)
        .replace("<tos>", product.data.product.terms_of_service))
    }
    
    if(this.client.embeds.sellixProduct.footer == true) productEmbed.setFooter({ text: `${message.author.username}`, iconURL: this.client.user.displayAvatarURL({ size: 1024, dynamic: true }) }).setTimestamp();
    if(this.client.embeds.sellixProduct.thumbnail == true) productEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    if(this.client.embeds.sellixProduct.description) productEmbed.setDescription(this.client.embeds.sellixProduct.description.replace("<name>", product.data.product.title)
      .replace("<description>", product.data.product.description)
      .replace("<price>", product.data.product.price)
      .replace("<stock>", product.data.product.stock)
      .replace("<tos>", product.data.product.terms_of_service));

    message.channel.send({ embeds: [productEmbed] });
  }
  async slashRun(interaction, args) {
    let productId = interaction.options.getString("product");

    let product = await getProduct(this.client, productId);
    if(!product) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");
    if(product.status != 200) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.sellix.no_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.sellixproduct.ephemeral });

    let productEmbed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.sellixProduct.color);
    
    if(this.client.embeds.sellixProduct.title) productEmbed.setTitle(this.client.embeds.sellixProduct.title);
    let field = this.client.embeds.sellixProduct.fields;
    for(let i = 0; i < this.client.embeds.sellixProduct.fields.length; i++) {
      productEmbed.addField(field[i].title, field[i].description.replace("<name>", product.data.product.title)
        .replace("<description>", product.data.product.description)
        .replace("<price>", product.data.product.price)
        .replace("<stock>", product.data.product.stock)
        .replace("<tos>", product.data.product.terms_of_service))
    }
    
    if(this.client.embeds.sellixProduct.footer == true) productEmbed.setFooter({ text: `${interaction.user.username}`, iconURL: this.client.user.displayAvatarURL({ size: 1024, dynamic: true }) }).setTimestamp();
    if(this.client.embeds.sellixProduct.thumbnail == true) productEmbed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
    
    if(this.client.embeds.sellixProduct.description) productEmbed.setDescription(this.client.embeds.sellixProduct.description.replace("<name>", product.data.product.title)
      .replace("<description>", product.data.product.description)
      .replace("<price>", product.data.product.price)
      .replace("<stock>", product.data.product.stock)
      .replace("<tos>", product.data.product.terms_of_service));
    
    interaction.reply({ embeds: [productEmbed], ephemeral: this.client.cmdConfig.sellixproduct.ephemeral });
  }
};