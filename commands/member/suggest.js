const Command = require("../../structures/Command");
const Discord = require("discord.js");
const db = require("quick.db");

module.exports = class Suggest extends Command {
  constructor(client) {
    super(client, {
      name: "suggest",
      description: client.cmdConfig.suggest.description,
      usage: client.cmdConfig.suggest.usage,
      permissions: client.cmdConfig.suggest.permissions,
      aliases: client.cmdConfig.suggest.aliases,
      category: "member",
      listed: client.cmdConfig.suggest.enabled,
      slash: true,
      options: [{
        name: 'suggestion',
        type: 'STRING',
        description: "Suggestion to send",
        required: true,
      }]
    });
  }

  async run(message, args) {
    const config = this.client.config;

    if(config.channels.suggestions == "") 
      return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.suggestion_title, this.client.language.ticket.no_suggest, this.client.embeds.error_color)] });
    if(!args[0]) return message.channel.send({ embeds: [this.client.utils.usage(this.client, message, this.client.cmdConfig.suggest.usage)] });
    let suggestion = args.join(" ");

    let suggChannel = this.client.utils.findChannel(message.guild, config.channels.suggestions);
    let decisionChannel = this.client.utils.findChannel(message.guild, config.channels.sugg_decision);

    let suggMenu = new Discord.MessageEmbed()
      .setColor(this.client.embeds.suggestion.color);
    
    if(this.client.embeds.suggestion.title) suggMenu.setTitle(this.client.embeds.suggestion.title);
    let field = this.client.embeds.suggestion.fields;
    for(let i = 0; i < this.client.embeds.suggestion.fields.length; i++) {
    suggMenu.addField(field[i].title, field[i].description.replace("<author>", message.author)
      .replace("<suggestion>", `${suggestion}`)
      .replace("<yes_vote>", 0)
      .replace("<no_vote>", 0)
      .replace("<date>", `${new Date().toLocaleString()}`))
    }
    
    if(this.client.embeds.suggestion.footer == true) suggMenu.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();
    if(this.client.embeds.suggestion.thumbnail == true) suggMenu.setThumbnail(message.guild.iconURL());
    
    if(this.client.embeds.suggestion.description) suggMenu.setDescription(this.client.embeds.suggestion.description.replace("<author>", message.author)
      .replace("<suggestion>", `${suggestion}`)
      .replace("<yes_vote>", 0)
      .replace("<no_vote>", 0)
      .replace("<date>", `${new Date().toLocaleString()}`));

    let suggRow = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.yes_vote)
        .setEmoji(this.client.config.emojis.yes_emoji)
        .setCustomId("vote_yes")
        .setStyle("PRIMARY"),
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.no_vote)
        .setEmoji(this.client.config.emojis.no_emoji)
        .setCustomId("vote_no")
        .setStyle("DANGER"),
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.remove_vote)
        .setEmoji(this.client.config.emojis.remove_vote)
        .setCustomId("vote_reset")
        .setStyle("SECONDARY")
    );

    let decisionRow = new Discord.MessageActionRow().addComponents(
      new Discord.MessageSelectMenu()
        .setCustomId("decision_menu")
        .setPlaceholder(this.client.language.general.suggestions.placeholder)
        .addOptions([{
          label: this.client.language.general.suggestions.decision.accept,
          value: "decision_accept",
          emoji: this.client.config.emojis.no_emoji
        }, {
          label: this.client.language.general.suggestions.decision.deny,
          value: "decision_deny",
          emoji: this.client.config.emojis.yes_emoji
        }, {
          label: this.client.language.general.suggestions.decision.delete,
          value: "decision_delete",
          emoji: this.client.config.emojis.remove_vote
        }])
    );

    message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.suggestions.sent, this.client.embeds.success_color)] }).then((m) => setTimeout(() => m.delete(), 5000));
    let m = await suggChannel.send({ embeds: [suggMenu], components: [suggRow] });
    if(this.client.config.general.sugg_decision == true) {
      let decisionMsg = await decisionChannel.send({ embeds: [suggMenu], components: [decisionRow] });
  
      db.set(`suggestion_${message.guild.id}_${m.id}`, {
        text: `${suggestion}`,
        date: `${new Date().toLocaleString()}`,
        decision: `${decisionMsg.id}`,
        author: message.author,
        yes: 0,
        no: 0,
        voters: []
      });
  
      db.set(`suggestionDecision_${message.guild.id}_${decisionMsg.id}`, `${m.id}`);
    } else {
      db.set(`suggestion_${message.guild.id}_${m.id}`, {
        text: `${suggestion}`,
        date: `${new Date().toLocaleString()}`,
        decision: null,
        author: message.author,
        yes: 0,
        no: 0,
        voters: []
      });
    }
  }
  async slashRun(interaction, args) {
    const config = this.client.config;
    let suggestion = interaction.options.getString("suggestion");

    if(config.channels.suggestions == "") 
      return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.suggestion_title, this.client.language.utility.no_text, this.client.embeds.error_color)] });

    let suggChannel = this.client.utils.findChannel(interaction.guild, config.channels.suggestions);
    let decisionChannel = this.client.utils.findChannel(interaction.guild, config.channels.sugg_decision);

    let suggMenu = new Discord.MessageEmbed()
      .setColor(this.client.embeds.suggestion.color);
    
    if(this.client.embeds.suggestion.title) suggMenu.setTitle(this.client.embeds.suggestion.title);
    let field = this.client.embeds.suggestion.fields;
    for(let i = 0; i < this.client.embeds.suggestion.fields.length; i++) {
    suggMenu.addField(field[i].title, field[i].description.replace("<author>", interaction.user)
      .replace("<suggestion>", `${suggestion}`)
      .replace("<yes_vote>", 0)
      .replace("<no_vote>", 0)
      .replace("<date>", `${new Date().toLocaleString()}`))
    }
    
    if(this.client.embeds.suggestion.footer == true) suggMenu.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setTimestamp();
    if(this.client.embeds.suggestion.thumbnail == true) suggMenu.setThumbnail(interaction.guild.iconURL());
    
    if(this.client.embeds.suggestion.description) suggMenu.setDescription(this.client.embeds.suggestion.description.replace("<author>", interaction.user)
      .replace("<suggestion>", `${suggestion}`)
      .replace("<yes_vote>", 0)
      .replace("<no_vote>", 0)
      .replace("<date>", `${new Date().toLocaleString()}`));

    let suggRow = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.yes_vote)
        .setEmoji(this.client.config.emojis.yes_emoji)
        .setCustomId("vote_yes")
        .setStyle("PRIMARY"),
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.no_vote)
        .setEmoji(this.client.config.emojis.no_emoji)
        .setCustomId("vote_no")
        .setStyle("DANGER"),
      new Discord.MessageButton()
        .setLabel(this.client.language.buttons.remove_vote)
        .setEmoji(this.client.config.emojis.remove_vote)
        .setCustomId("vote_reset")
        .setStyle("SECONDARY")
    );

    let decisionRow = new Discord.MessageActionRow().addComponents(
      new Discord.MessageSelectMenu()
        .setCustomId("decision_menu")
        .setPlaceholder(this.client.language.general.suggestions.placeholder)
        .addOptions([{
          label: this.client.language.general.suggestions.decision.accept,
          value: "decision_accept",
          emoji: this.client.config.emojis.no_emoji
        }, {
          label: this.client.language.general.suggestions.decision.deny,
          value: "decision_deny",
          emoji: this.client.config.emojis.yes_emoji
        }, {
          label: this.client.language.general.suggestions.decision.delete,
          value: "decision_delete",
          emoji: this.client.config.emojis.remove_vote
        }])
    );

    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.sent, this.client.embeds.success_color)], ephemeral: true });
    let m = await suggChannel.send({ embeds: [suggMenu], components: [suggRow] });
    let decisionMsg = await decisionChannel.send({ embeds: [suggMenu], components: [decisionRow] });

    db.set(`suggestion_${interaction.guild.id}_${m.id}`, {
      text: `${suggestion}`,
      date: `${new Date().toLocaleString()}`,
      decision: `${decisionMsg.id}`,
      author: interaction.user,
      yes: 0,
      no: 0,
      voters: []
    });

    db.set(`suggestionDecision_${interaction.guild.id}_${decisionMsg.id}`, `${m.id}`);
  }
};
