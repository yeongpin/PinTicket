const Command = require("../../structures/Command");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require("quick.db");

module.exports = class Panel extends Command {
	constructor(client) {
		super(client, {
			name: "panel",
			description: client.cmdConfig.panel.description,
			usage: client.cmdConfig.panel.usage,
			permissions: client.cmdConfig.panel.permissions,
      aliases: client.cmdConfig.panel.aliases,
			category: "tickets",
			listed: client.cmdConfig.panel.enabled,
      slash: true,
      options: [{
        name: "category",
        description: "Ticket Category for Panel (If want Separate Panels)",
        type: "STRING",
        required: false,
      }]
		});
	}
  
  async run(message, args) {
    let config = this.client.config;
    let language = this.client.language;
    let category = args[0] || "general";
    let separatedPanel = category.toLowerCase() != "general";
    if(separatedPanel == true && !category) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, language.ticket.invalid_panel, this.client.embeds.error_color)] });
    let findCategory = this.client.config.categories.find((c) => c.id.toLowerCase() == category.toLowerCase());
    if(separatedPanel == true && !findCategory) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, language.ticket.invalid_panel, this.client.embeds.error_color)] });

    const buttonRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(separatedPanel == true ? `createTicket_${category}` : 'createTicket')
          .setLabel(separatedPanel == true ? `${findCategory.name}` : this.client.language.buttons.create)
          .setEmoji(separatedPanel == true ? `${findCategory.emoji}` : config.emojis.create)
          .setStyle('PRIMARY'),
      );
      
    let embed = new MessageEmbed()
      .setTitle(separatedPanel == true ? `${findCategory.panel.title}` : this.client.embeds.title)
      .setDescription(separatedPanel == true ? `${findCategory.panel.description}` : this.client.embeds.panel_message)
      .setColor(separatedPanel == true ? `${findCategory.panel.color}` : this.client.embeds.general_color);

    if(this.client.embeds.panel.footer.enabled == true) embed.setFooter({ text: this.client.embeds.footer, iconURL: this.client.user.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.panel.image.enabled == true) embed.setImage(this.client.embeds.panel.image.url);
    if(this.client.embeds.panel.thumbnail.enabled == true) embed.setThumbnail(this.client.embeds.panel.thumbnail.url);

    message.channel.send({embeds: [embed], components: [buttonRow]});
  }
  async slashRun(interaction, args) {
    let config = this.client.config;
    let language = this.client.language;
    let category = interaction.options.getString("category") || "general";
    let separatedPanel = category.toLowerCase() != "general";
    if(separatedPanel == true && !category) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, member.user, this.client.embeds.title, language.ticket.invalid_panel, this.client.embeds.error_color)], ephemeral: true });
    let findCategory = this.client.config.categories.find((c) => c.id.toLowerCase() == category.toLowerCase());
    if(separatedPanel == true && !findCategory) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, member.user, this.client.embeds.title, language.ticket.invalid_panel, this.client.embeds.error_color)], ephemeral: true });

    const buttonRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(separatedPanel == true ? `createTicket_${category}` : 'createTicket')
          .setLabel(separatedPanel == true ? `${findCategory.name}` : this.client.language.buttons.create)
          .setEmoji(separatedPanel == true ? `${findCategory.emoji}` : config.emojis.create)
          .setStyle('PRIMARY'),
      );
      
    let embed = new MessageEmbed()
      .setTitle(separatedPanel == true ? `${findCategory.panel.title}` : this.client.embeds.title)
      .setDescription(separatedPanel == true ? `${findCategory.panel.description}` : this.client.embeds.panel_message)
      .setColor(separatedPanel == true ? `${findCategory.panel.color}` : this.client.embeds.general_color);

    if(this.client.embeds.panel.footer.enabled == true) embed.setFooter({ text: this.client.embeds.footer, iconURL: this.client.user.displayAvatarURL() }).setTimestamp();
    if(this.client.embeds.panel.image.enabled == true) embed.setImage(this.client.embeds.panel.image.url);
    if(this.client.embeds.panel.thumbnail.enabled == true) embed.setThumbnail(this.client.embeds.panel.thumbnail.url);

    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.panel_created, this.client.embeds.success_color)], ephemeral: true });
    interaction.channel.send({embeds: [embed], components: [buttonRow]});
  }
};