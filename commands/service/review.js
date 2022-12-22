const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");

module.exports = class Review extends Command {
  constructor(client) {
    super(client, {
      name: "review",
      description: client.cmdConfig.review.description,
      usage: client.cmdConfig.review.usage,
      permissions: client.cmdConfig.review.permissions,
      aliases: client.cmdConfig.review.aliases,
      category: "service",
      listed: client.cmdConfig.review.enabled,
      slash: true,
      options: [{
        name: 'user',
        type: 'USER',
        description: "User to review",
        required: true,
      },{
        name: 'rating',
        type: 'NUMBER',
        description: "Rating to give, 1-5",
        required: true,
      },{
        name: 'comment',
        type: 'STRING',
        description: "Review Comment",
        required: true,
      }]
    });
  }

  async run(message, args) {
    let config = this.client.config;

    let user = message.mentions.users.first() || this.client.users.cache.get(args[0]);
    let rating = args[1];
    let reason = args.slice(2).join(" ");

    if(!user) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.review.usage)] });
    if(!rating || isNaN(rating) || rating < 1 || rating > 5) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.review.usage)] });
    if(!reason || reason.length > this.client.config.general.review_limit) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.review.usage)] });

    let member = message.guild.members.cache.get(user.id);
    if(this.client.utils.permissionsLength(message, member, config.general.review_req.permissions) > 0 || !this.client.utils.hasRole(this.client, message.guild, member, config.general.review_req.roles, true)) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.service.reviews.cannot_review, this.client.embeds.error_color)] });

    if(user.id == message.author.id) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.language.titles.error, this.client.language.service.review_self, this.client.embeds.error_color )] });

    let rId = this.client.utils.generateId();

    let rObject = {
      id: rId, 
      author: message.author.id,
      user: user.id,
      rating: rating, 
      comment: reason, 
      date: new Date()
    }
    
    this.client.utils.pushReview(message, user.id, rObject);
    
    let embed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.service.review.color);
    
    if(this.client.embeds.service.review.title) embed.setTitle(this.client.embeds.service.review.title);
    
    let review = "";
    for(let i = 0; i < Math.floor(rating); i++) {
      review += "⭐ "
    } 
    
    if(this.client.embeds.service.review.description) embed.setDescription(this.client.embeds.service.review.description.replace("<author>", message.author)
        .replace("<user>", user)
        .replace("<date>", new Date().toLocaleString())
        .replace("<review>", review)
        .replace("<comment>", reason));
    
    let field = this.client.embeds.service.review.fields;
    for(let i = 0; i < this.client.embeds.service.review.fields.length; i++) {
      embed.addField(field[i].title, field[i].description.replace("<author>", message.author)
        .replace("<user>", user)
        .replace("<date>", new Date().toLocaleString())
        .replace("<review>", review)
        .replace("<comment>", reason), false)
    }
    
    if(this.client.config.general.send_review == true) {
      if(this.client.utils.findChannel(message.guild, this.client.config.channels.reviews)) {
        let reviewCh = this.client.utils.findChannel(message.guild, this.client.config.channels.reviews);
        let secondEmbed = new Discord.MessageEmbed()
          .setColor(this.client.embeds.service.reviewAnnounce.color);
        
        if(this.client.embeds.service.reviewAnnounce.title) secondEmbed.setTitle(this.client.embeds.service.reviewAnnounce.title);
        
        if(this.client.embeds.service.reviewAnnounce.description) secondEmbed.setDescription(this.client.embeds.service.reviewAnnounce.description.replace("<author>", message.author)
            .replace("<user>", user)
            .replace("<date>", new Date().toLocaleString())
            .replace("<review>", review)
            .replace("<comment>", reason));
        
        let field = this.client.embeds.service.reviewAnnounce.fields;
        for(let i = 0; i < this.client.embeds.service.reviewAnnounce.fields.length; i++) {
          secondEmbed.addField(field[i].title, field[i].description.replace("<author>", message.author)
            .replace("<user>", user)
            .replace("<date>", new Date().toLocaleString())
            .replace("<review>", review)
            .replace("<comment>", reason), false)
        }

        if(this.client.embeds.service.reviewAnnounce.footer == true) secondEmbed.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() }).setTimestamp();
        if(this.client.embeds.service.reviewAnnounce.thumbnail == true) secondEmbed.setThumbnail(user.displayAvatarURL());

        reviewCh.send({ embeds: [secondEmbed]});
      }
    }

    if(this.client.embeds.service.review.footer == true) embed.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.review.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
    
    message.channel.send({ embeds: [embed] })
  }
  async slashRun(interaction, args) {
    let config = this.client.config;

    let user = interaction.options.getUser("user");
    let rating = interaction.options.getNumber("rating");
    let reason = interaction.options.getString("comment");

    if(isNaN(rating) || rating < 1 || rating > 5) return interaction.reply({ embeds: [this.client.utils.usage(this.client, interaction, this.client.cmdConfig.review.usage)] }); 
    if(reason.length > this.client.config.general.review_limit) return interaction.reply({ embeds: [this.client.utils.usage(this.client, interaction, this.client.cmdConfig.review.usage)] }); 

    let member = interaction.guild.members.cache.get(user.id);
    if(this.client.utils.permissionsLength(interaction, member, config.general.review_req.permissions) > 0 || !this.client.utils.hasRole(this.client, interaction.guild, member, config.general.review_req.roles, true)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.service.reviews.cannot_review, this.client.embeds.error_color)] });

    if(user.id == interaction.user.id) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.language.titles.error, this.client.language.service.review_self, this.client.embeds.error_color )] });

    let rId = this.client.utils.generateId();

    let rObject = {
      id: rId, 
      author: interaction.user.id,
      user: user.id,
      rating: rating, 
      comment: reason, 
      date: new Date()
    }
    
    this.client.utils.pushReview(interaction, user.id, rObject);
    
    let embed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.service.review.color);
    
    if(this.client.embeds.service.review.title) embed.setTitle(this.client.embeds.service.review.title);
    
    let review = "";
    for(let i = 0; i < Math.floor(rating); i++) {
      review += "⭐ "
    } 
    
    if(this.client.embeds.service.review.description) embed.setDescription(this.client.embeds.service.review.description.replace("<author>", interaction.user)
        .replace("<user>", user)
        .replace("<date>", new Date().toLocaleString())
        .replace("<review>", review)
        .replace("<comment>", reason));
    
    let field = this.client.embeds.service.review.fields;
    for(let i = 0; i < this.client.embeds.service.review.fields.length; i++) {
      embed.addField(field[i].title, field[i].description.replace("<author>", interaction.user)
        .replace("<user>", user)
        .replace("<date>", new Date().toLocaleString())
        .replace("<review>", review)
        .replace("<comment>", reason), false)
    }
    
    if(this.client.config.general.send_review == true) {
      if(this.client.utils.findChannel(interaction.guild, this.client.config.channels.reviews)) {
        let reviewCh = this.client.utils.findChannel(interaction.guild, this.client.config.channels.reviews);
        let secondEmbed = new Discord.MessageEmbed()
          .setColor(this.client.embeds.service.reviewAnnounce.color);
        
        if(this.client.embeds.service.reviewAnnounce.title) secondEmbed.setTitle(this.client.embeds.service.reviewAnnounce.title);
        
        if(this.client.embeds.service.reviewAnnounce.description) secondEmbed.setDescription(this.client.embeds.service.reviewAnnounce.description.replace("<author>", interaction.user)
            .replace("<user>", user)
            .replace("<date>", new Date().toLocaleString())
            .replace("<review>", review)
            .replace("<comment>", reason));
        
        let field = this.client.embeds.service.reviewAnnounce.fields;
        for(let i = 0; i < this.client.embeds.service.reviewAnnounce.fields.length; i++) {
          secondEmbed.addField(field[i].title, field[i].description.replace("<author>", interaction.user)
            .replace("<user>", user)
            .replace("<date>", new Date().toLocaleString())
            .replace("<review>", review)
            .replace("<comment>", reason), false)
        }

        if(this.client.embeds.service.reviewAnnounce.footer == true) secondEmbed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
        if(this.client.embeds.service.reviewAnnounce.thumbnail == true) secondEmbed.setThumbnail(user.displayAvatarURL());

        reviewCh.send({ embeds: [secondEmbed]});
      }
    }

    if(this.client.embeds.service.review.footer == true) embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.review.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
    
    interaction.reply({ embeds: [embed] })
  }
};