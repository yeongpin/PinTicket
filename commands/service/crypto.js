const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const cryptoData = require("../../data/crypto.json");
const fetch = require("node-fetch");

module.exports = class Crypto extends Command {
  constructor(client) {
    super(client, {
      name: "crypto",
      description: client.cmdConfig.crypto.description,
      usage: client.cmdConfig.crypto.usage,
      permissions: client.cmdConfig.crypto.permissions,
      aliases: client.cmdConfig.crypto.aliases,
      category: "service",
      listed: client.cmdConfig.crypto.enabled,
      slash: true,
      options: [{
        name: 'user',
        type: 'USER',
        description: "User who to pay",
        required: true,
      },{
        name: 'crypto',
        type: 'STRING',
        description: "Crypto to receive (full name)",
        required: true,
      },{
        name: 'address',
        type: 'STRING',
        description: "Address to send Money to",
        required: true,
      },{
        name: 'amount',
        type: 'NUMBER',
        description: "Amount of Money in USD",
        required: true,
      },{
        name: 'service',
        type: 'STRING',
        description: "Service User's paying for",
        required: true,
      }]
    });
  }

  async run(message, args) {
    let config = this.client.config;

    let user = message.mentions.users.first() || this.client.users.cache.get(args[0]);
    let crypto = args[1];
    let address = args[2];
    let amount = args[3];
    let service = args.slice(4).join(" ");

    if(!user) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.crypto.usage)] });
    if(!crypto) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.crypto.usage)] });
    if(!address) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.crypto.usage)] });
    if(!amount) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.crypto.usage)] });
    if(!service || service.length > 256) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.crypto.usage)] });
    
    let converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto}?amount=${amount}`;

    let fullCrypto = "";
    let cryptoAmount;

    if(Object.values(cryptoData).map(x => x.toLowerCase()).includes(crypto.toLowerCase())) {
      fullCrypto = crypto;
      let cryptoIndex = Object.values(cryptoData).map(x => x.toLowerCase()).indexOf(crypto.toLowerCase());
      crypto = Object.keys(cryptoData)[cryptoIndex];
      converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto.toLowerCase()}?amount=${amount}`;
      converted = await fetch(converted);
      converted = await converted.json();
      cryptoAmount = Object.values(converted)[2];
    } else if(Object.keys(cryptoData).includes(crypto.toUpperCase())) {
      converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto.toLowerCase()}?amount=${amount}`;
      converted = await fetch(converted);
      converted = await converted.json();
      let cryptoIndex = Object.keys(cryptoData).indexOf(crypto.toUpperCase());
      crypto = Object.values(cryptoData)[cryptoIndex];
      fullCrypto = crypto;
      cryptoAmount = Object.values(converted)[2];
    } else {
      message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.language.titles.error, this.client.language.service.invalid_crypto, this.client.embeds.error_color)] });
      return;
    }

    let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${fullCrypto.toLowerCase()}:${address}?amount=${cryptoAmount};`

    let embed = new MessageEmbed()
      .setImage(link)
      .setColor(this.client.embeds.service.crypto.color);
    if(this.client.embeds.service.crypto.title) embed.setTitle(this.client.embeds.service.crypto.title);
    
    if(this.client.embeds.service.crypto.description) embed.setDescription(this.client.embeds.service.crypto.description.replace("<amount>", amount)
      .replace("<seller>", message.author)
      .replace("<user>", user)
      .replace("<address>", address)
      .replace("<currency>", this.client.config.general.currency)
      .replace("<currencySymbol>", this.client.config.general.currency_symbol)
      .replace("<symbol>", Object.keys(converted)[2])
      .replace("<cryptoAmount>", Object.values(converted)[2])
      .replace("<service>", service));
    
    let field = this.client.embeds.service.crypto.fields;
    for(let i = 0; i < this.client.embeds.service.crypto.fields.length; i++) {
      embed.addField(field[i].title.replace("<symbol>", Object.keys(converted)[2])
        .replace("<currency>", this.client.config.general.currency), field[i].description.replace("<amount>", amount)
        .replace("<seller>", message.author)
        .replace("<user>", user)
        .replace("<address>", address)
        .replace("<currency>", this.client.config.general.currency)
        .replace("<currencySymbol>", this.client.config.general.currency_symbol)
        .replace("<symbol>", Object.keys(converted)[2])
        .replace("<cryptoAmount>", Object.values(converted)[2])
        .replace("<service>", service), true)
    }
    
    if(this.client.embeds.service.crypto.footer == true ) embed.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.crypto.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
      
    message.channel.send({ embeds: [embed] });
  }
  async slashRun(interaction, args) {
    let config = this.client.config;

    let user = interaction.options.getUser("user");
    let crypto = interaction.options.getString("crypto");
    let address = interaction.options.getString("address");
    let amount = interaction.options.getNumber("amount");
    let service = interaction.options.getString("service");

    let fullCrypto = "";
    let cryptoAmount;
    
    let converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto}?amount=${amount}`;
    
    if(Object.values(cryptoData).map(x => x.toLowerCase()).includes(crypto.toLowerCase())) {
      fullCrypto = crypto;
      let cryptoIndex = Object.values(cryptoData).map(x => x.toLowerCase()).indexOf(crypto.toLowerCase());
      crypto = Object.keys(cryptoData)[cryptoIndex];
      converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto.toLowerCase()}?amount=${amount}`;
      converted = await fetch(converted);
      converted = await converted.json();
      cryptoAmount = Object.values(converted)[2];
    } else if(Object.keys(cryptoData).includes(crypto.toUpperCase())) {
      converted = `https://api.coinconvert.net/convert/${this.client.config.general.currency.toLowerCase()}/${crypto.toLowerCase()}?amount=${amount}`;
      converted = await fetch(converted);
      converted = await converted.json();
      let cryptoIndex = Object.keys(cryptoData).indexOf(crypto.toUpperCase());
      crypto = Object.values(cryptoData)[cryptoIndex];
      fullCrypto = crypto;
      cryptoAmount = Object.values(converted)[2];
    } else {
      interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.language.titles.error, this.client.language.service.invalid_crypto, this.client.embeds.error_color)] });
      return;
    }

    let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${fullCrypto.toLowerCase()}:${address}?amount=${cryptoAmount};`
    
    let embed = new MessageEmbed()
      .setImage(link)
      .setColor(this.client.embeds.service.crypto.color);
    if(this.client.embeds.service.crypto.title) embed.setTitle(this.client.embeds.service.crypto.title);
    
    if(this.client.embeds.service.crypto.description) embed.setDescription(this.client.embeds.service.crypto.description.replace("<amount>", amount)
      .replace("<seller>", interaction.user)
      .replace("<user>", user)
      .replace("<address>", address)
      .replace("<currency>", this.client.config.general.currency)
      .replace("<currencySymbol>", this.client.config.general.currency_symbol)
      .replace("<symbol>", Object.keys(converted)[2])
      .replace("<cryptoAmount>", Object.values(converted)[2])
      .replace("<service>", service));
    
    let field = this.client.embeds.service.crypto.fields;
    for(let i = 0; i < this.client.embeds.service.crypto.fields.length; i++) {
      embed.addField(field[i].title.replace("<symbol>", Object.keys(converted)[2])
        .replace("<currency>", this.client.config.general.currency), field[i].description.replace("<amount>", amount)
        .replace("<seller>", interaction.user)
        .replace("<user>", user)
        .replace("<currency>", this.client.config.general.currency)
        .replace("<currencySymbol>", this.client.config.general.currency_symbol)
        .replace("<address>", address)
        .replace("<symbol>", Object.keys(converted)[2])
        .replace("<cryptoAmount>", Object.values(converted)[2])
        .replace("<service>", service), true)
    }
    
    if(this.client.embeds.service.crypto.footer == true ) embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.crypto.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
      
    interaction.reply({ embeds: [embed] });
  }
};