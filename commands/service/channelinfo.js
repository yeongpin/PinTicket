const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");

module.exports = class ChannelInfo extends Command {
  constructor(client) {
    super(client, {
      name: "channelinfo",
      description: client.cmdConfig.channelinfo.description,
      usage: client.cmdConfig.channelinfo.usage,
      permissions: client.cmdConfig.channelinfo.permissions,
      aliases: client.cmdConfig.channelinfo.aliases,
      category: "service",
      listed: client.cmdConfig.channelinfo.enabled,
      slash: true
    });
  }

  async run(message, args) {
    if (!message.channel.name.includes(this.client.config.channels.channel_name)) 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });

    let ans = db.fetch(`channelQuestions_${message.channel.id}`) || [{
      question: 'No Questions',
      answer: 'No Answers'
    }];
    
    let notes = db.fetch(`notes_${message.channel.id}`) || 'No Notes';
    let claimed = db.fetch(`ticketClaimed_${message.channel.id}`) || "N/A";
    let ticketId = db.fetch(`ticket_${message.guild.id}`) + 1;

    let embed = new Discord.MessageEmbed()
      .setTitle(this.client.embeds.channelInfo.title)
      .setColor(this.client.embeds.channelInfo.color);

    if(this.client.embeds.channelInfo.footer == true) embed.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();

    if(this.client.embeds.channelInfo.questions == true) {
      for(let i = 0; i < ans.length; i++) {
        embed.addField(ans[i].question, ans[i].answer);
      }
    }

    if(this.client.embeds.channelInfo.fields.ticketId != "") embed.addField(`${this.client.embeds.channelInfo.fields.ticketId}`, `${ticketId}`);
    if(this.client.embeds.channelInfo.fields.claimed != "") embed.addField(`${this.client.embeds.channelInfo.fields.claimed}`, `${claimed}`);
    embed.addField(`${this.client.embeds.channelInfo.fields.notes}`, `\`\`\`${notes}\`\`\``);

    message.channel.send({ embeds: [embed] });
  }
  async slashRun(interaction, args) {
    if (!interaction.channel.name.includes(this.client.config.channels.channel_name)) 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.ticket_channel, this.client.embeds.error_color)] });

    let ans = db.fetch(`channelQuestions_${interaction.channel.id}`) || [{
      question: 'No Questions',
      answer: 'No Answers'
    }];
    let notes = db.fetch(`notes_${interaction.channel.id}`) || 'No Notes';
    let claimed = db.fetch(`ticketClaimed_${interaction.channel.id}`) || "N/A";
    let ticketId = db.fetch(`ticket_${interaction.guild.id}`) + 1;

    let embed = new Discord.MessageEmbed()
      .setTitle(this.client.embeds.channelInfo.title)
      .setColor(this.client.embeds.channelInfo.color);

    if(this.client.embeds.channelInfo.footer == true) embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setTimestamp();
    
    if(this.client.embeds.channelInfo.questions == true) {
      for(let i = 0; i < ans.length; i++) {
        embed.addField(ans[i].question, ans[i].answer);
      }
    }

    if(this.client.embeds.channelInfo.fields.ticketId != "") embed.addField(`${this.client.embeds.channelInfo.fields.ticketId}`, `${ticketId}`);
    if(this.client.embeds.channelInfo.fields.claimed != "") embed.addField(`${this.client.embeds.channelInfo.fields.claimed}`, `${claimed}`);
    embed.addField(`${this.client.embeds.channelInfo.fields.notes}`, `\`\`\`${notes}\`\`\``);

    interaction.reply({ embeds: [embed], ephemeral: this.client.cmdConfig.channelinfo.ephemeral });
  }
};