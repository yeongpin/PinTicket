const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");
const { getOrder } = require("../../utils/sellix");

module.exports = class SellixLicense extends Command {
  constructor(client) {
    super(client, {
      name: "sellixlicense",
      description: client.cmdConfig.sellixlicense.description,
      usage: client.cmdConfig.sellixlicense.usage,
      permissions: client.cmdConfig.sellixlicense.permissions,
      aliases: client.cmdConfig.sellixlicense.aliases,
      category: "sellix",
      listed: client.cmdConfig.sellixlicense.enabled,
      slash: true,
      options: [{
        name: "order",
        description: "Order ID to Check",
        type: "STRING",
        required: true
      }]
    });
  }

  async run(message, args) {
    let orderId = args[0];

    if(!orderId) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.sellixlicense.usage)] });

    let check = await getOrder(this.client, orderId);
    if(!check) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");
    if(check.status != 200) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.sellix.no_id, this.client.embeds.error_color)] });

    let discordVerified = db.fetch(`sellixVerified_${message.guild.id}`) || [];
    discordVerified = discordVerified.find((x) => x.key.toLowerCase() == orderId.toLowerCase());

    let licenseEmbed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.licenseInfo.color);

    if(this.client.embeds.licenseInfo.title) licenseEmbed.setTitle(this.client.embeds.licenseInfo.title);
    let field = this.client.embeds.licenseInfo.fields;
    for(let i = 0; i < this.client.embeds.licenseInfo.fields.length; i++) {
      licenseEmbed.addField(field[i].title, field[i].description.replace("<name>", check.data.order.name)
        .replace("<mail>", check.data.order.customer_email)
        .replace("<product>", check.data.order.product_title)
        .replace("<price>", check.data.order.total)
        .replace("<gateway>", check.data.order.gateway)
        .replace("<license>", orderId)
        .replace("<discord_name>", discordVerified ? `<@!${discordVerified.userId}>` : "/"))
    }
    
    if(this.client.embeds.licenseInfo.footer == true) licenseEmbed.setFooter({ text: `${message.author.username}`, iconURL: this.client.user.displayAvatarURL({ size: 1024, dynamic: true }) }).setTimestamp();
    if(this.client.embeds.licenseInfo.thumbnail == true) licenseEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    if(this.client.embeds.licenseInfo.description) licenseEmbed.setDescription(this.client.embeds.licenseInfo.description.replace("<name>", check.data.order.name)
      .replace("<mail>", check.data.order.customer_email)
      .replace("<product>", check.data.order.product_title)
      .replace("<price>", check.data.order.total)
      .replace("<gateway>", check.data.order.gateway)
      .replace("<license>", orderId)
      .replace("<discord_name>", discordVerified ? `<@!${discordVerified.userId}>` : "/"));

    message.channel.send({ embeds: [licenseEmbed] });
  }
  async slashRun(interaction, args) {
    let orderId = interaction.options.getString("order");

    let check = await getOrder(this.client, orderId);
    if(!check) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");
    if(check.status != 200) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.sellix.no_id, this.client.embeds.error_color)], ephemeral: this.client.cmdConfig.sellixlicense.ephemeral });
    
    let discordVerified = db.fetch(`sellixVerified_${interaction.guild.id}`) || [];
    discordVerified = discordVerified.find((x) => x.key.toLowerCase() == orderId.toLowerCase());
    
    let licenseEmbed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.licenseInfo.color);
    
    if(this.client.embeds.licenseInfo.title) licenseEmbed.setTitle(this.client.embeds.licenseInfo.title);
    let field = this.client.embeds.licenseInfo.fields;
    for(let i = 0; i < this.client.embeds.licenseInfo.fields.length; i++) {
      licenseEmbed.addField(field[i].title, field[i].description.replace("<name>", check.data.order.name)
        .replace("<mail>", check.data.order.customer_email)
        .replace("<product>", check.data.order.product_title)
        .replace("<price>", check.data.order.total)
        .replace("<gateway>", check.data.order.gateway)
        .replace("<license>", orderId)
        .replace("<discord_name>", discordVerified ? `<@!${discordVerified.userId}>` : "/"))
    }
    
    if(this.client.embeds.licenseInfo.footer == true) licenseEmbed.setFooter({ text: `${interaction.user.username}`, iconURL: this.client.user.displayAvatarURL({ size: 1024, dynamic: true }) }).setTimestamp();
    if(this.client.embeds.licenseInfo.thumbnail == true) licenseEmbed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
    
    if(this.client.embeds.licenseInfo.description) licenseEmbed.setDescription(this.client.embeds.licenseInfo.description.replace("<name>", check.data.order.name)
      .replace("<mail>", check.data.order.customer_email)
      .replace("<product>", check.data.order.product_title)
      .replace("<price>", check.data.order.total)
      .replace("<gateway>", check.data.order.gateway)
      .replace("<license>", orderId)
      .replace("<discord_name>", discordVerified ? `<@!${discordVerified.userId}>` : "/"));
    
    interaction.reply({ embeds: [licenseEmbed], ephemeral: this.client.cmdConfig.sellixlicense.ephemeral });
  }
};