const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");

module.exports = class Profile extends Command {
  constructor(client) {
    super(client, {
      name: "profile",
      description: client.cmdConfig.profile.description,
      usage: client.cmdConfig.profile.usage,
      permissions: client.cmdConfig.profile.permissions,
      aliases: client.cmdConfig.profile.aliases,
      category: "service",
      listed: client.cmdConfig.profile.enabled,
      slash: true,
      options: [{
        name: 'user',
        type: 'USER',
        description: "User who's Profile to view",
        required: false,
      }]
    });
  }

  async run(message, args) {
    const config = this.client.config;
    const user = message.mentions.users.first() || message.author;
    
    let history = db.fetch(`reviews_${message.guild.id}_${user.id}`) || [];
    let bio = db.fetch(`bio_${message.guild.id}_${user.id}`) || 'N/A';
    let claimed = db.fetch(`claimedStats_${user.id}`) || 0;
    let contentHistory = String();

    let available = db.fetch(`status_${user.id}`);
    available = available == 1 ? this.client.language.service.availability.unavailable : this.client.language.service.availability.available;
    
    let paypal = db.fetch(`paypal_${user.id}`) || this.client.language.service.no_paypal;
    let hours = db.fetch(`availableHours_${user.id}`) || this.client.language.service.no_hours;

    let totalResponse = db.fetch(`totalResponse_${message.guild.id}_${user.id}`) || [];

    let avgTotal = 0;

    for(let i = 0; i < totalResponse.length; i++) {
      avgTotal += totalResponse[i];
    }

    avgTotal = avgTotal / totalResponse.length;

    for(const review of history.slice(0, 5)) {
      if(history.length == 0) break;
      let author = this.client.users.cache.get(review.author);
      if(author == undefined || author == null) continue;
      contentHistory += `\n> \`#${review.id}\` [${review.rating} ⭐] **${author}** \`(${review.comment})\``
    }
    
    let totalRating = 0;
    for(let i = 0; i < history.length; i++) {
      totalRating += parseInt(history[i].rating);
    }
    
    totalRating = Math.floor(totalRating/history.length);
    
    let embed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.service.profile.color);
    
    if(this.client.embeds.service.profile.title) embed.setTitle(this.client.embeds.service.profile.title);
    
    if(history.length == 0) totalRating = "N/A";
    if(history.length == 0) contentHistory = `> No Reviews`;
    
    let field = this.client.embeds.service.profile.fields;
    for(let i = 0; i < this.client.embeds.service.profile.fields.length; i++) {
      embed.addField(field[i].title, field[i].description.replace("<user>", user)
        .replace("<reviews>", contentHistory || `> No Reviews`)
        .replace("<bio>", bio.replaceAll("/n", "\n")
          .replace("\\**", "**"))
        .replace("<claimed>", claimed)
        .replace("<responseTime>", `${totalResponse.length == 0 ? '0s' : this.client.utils.formatTime(avgTotal)}`)
        .replace("<hours>", hours)
        .replace("<paypal>", paypal)
        .replace("<status>", available)
        .replace("<numRating>", totalRating)
        .replace("<totalRating>", !isNaN(totalRating) ? `⭐`.repeat(totalRating) : 'N/A'))
    }
    
    if(this.client.embeds.service.profile.footer == true) embed.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.profile.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
    
    if(this.client.embeds.service.profile.description) embed.setDescription(this.client.embeds.service.profile.description.replace("<user>", user)
        .replace("<reviews>", contentHistory || `> No Reviews`)
        .replace("<bio>", bio.replaceAll("/n", "\n")
          .replace("\\**", "**"))
        .replace("<claimed>", claimed)
        .replace("<responseTime>", `${totalResponse.length == 0 ? '0s' : this.client.utils.formatTime(avgTotal)}`)
        .replace("<hours>", hours)
        .replace("<paypal>", paypal)
        .replace("<status>", available)
        .replace("<numRating>", totalRating)
        .replace("<totalRating>", `⭐`.repeat(totalRating)));
    
    message.channel.send({ embeds: [embed] });
  }
  async slashRun(interaction, args) {
    const config = this.client.config;
    const user = interaction.options.getUser("user") || interaction.user;
    
    let available = db.fetch(`status_${user.id}`);
    available = available == 1 ? this.client.language.service.availability.unavailable : this.client.language.service.availability.available;
    
    let paypal = db.fetch(`paypal_${user.id}`) || this.client.language.service.no_paypal;
    let hours = db.fetch(`availableHours_${user.id}`) || this.client.language.service.no_hours;

    let totalResponse = db.fetch(`totalResponse_${interaction.guild.id}_${user.id}`) || [];

    let avgTotal = 0;

    for(let i = 0; i < totalResponse.length; i++) {
      avgTotal += totalResponse[i];
    }

    avgTotal = avgTotal / totalResponse.length;

    let history = db.fetch(`reviews_${interaction.guild.id}_${user.id}`) || [];
    let bio = db.fetch(`bio_${interaction.guild.id}_${user.id}`) || 'N/A';
    let claimed = db.fetch(`claimedStats_${user.id}`) || 0;
    let contentHistory = String();
    
    for(const review of history.slice(0, 5)) {
      if(history.length == 0) break;
      let author = this.client.users.cache.get(review.author);
      if(author == undefined || author == null) continue;
      contentHistory += `\n> \`#${review.id}\` [${review.rating} ⭐] **${author}** \`(${review.comment})\``
    }
    
    let totalRating = 0;
    for(let i = 0; i < history.length; i++) {
      totalRating += parseInt(history[i].rating);
    }
    
    totalRating = Math.floor(totalRating/history.length);
    
    let embed = new Discord.MessageEmbed()
      .setColor(this.client.embeds.service.profile.color);
    
    if(this.client.embeds.service.profile.title) embed.setTitle(this.client.embeds.service.profile.title);
    
    if(history.length == 0) totalRating = "N/A"
    
    let field = this.client.embeds.service.profile.fields;
    for(let i = 0; i < this.client.embeds.service.profile.fields.length; i++) {
      embed.addField(field[i].title, field[i].description.replace("<user>", user)
        .replace("<reviews>", contentHistory || `> No Reviews`)
        .replace("<bio>", bio.replaceAll("/n", "\n")
          .replace("\\**", "**"))
        .replace("<claimed>", claimed)
        .replace("<responseTime>", `${totalResponse.length == 0 ? '0s' : this.client.utils.formatTime(avgTotal)}`)
        .replace("<hours>", hours)
        .replace("<paypal>", paypal)
        .replace("<status>", available)
        .replace("<numRating>", totalRating)
        .replace("<totalRating>", `⭐`.repeat(totalRating)))
    }
    
    if(this.client.embeds.service.profile.footer == true) embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.service.profile.thumbnail == true) embed.setThumbnail(user.displayAvatarURL());
    
    if(this.client.embeds.service.profile.description) embed.setDescription(this.client.embeds.service.profile.description.replace("<user>", user)
        .replace("<reviews>", contentHistory || `> No Reviews`)
        .replace("<bio>", bio.replaceAll("/n", "\n")
          .replace("\\**", "**"))
        .replace("<claimed>", claimed)
        .replace("<responseTime>", `${totalResponse.length == 0 ? '0s' : this.client.utils.formatTime(avgTotal)}`)
        .replace("<hours>", hours)
        .replace("<paypal>", paypal)
        .replace("<status>", available)
        .replace("<numRating>", totalRating)
        .replace("<totalRating>", `⭐`.repeat(totalRating)));
    
    interaction.reply({ embeds: [embed], ephemeral: this.client.cmdConfig.profile.ephemeral });
  }
};