const Command = require("../../structures/Command");
const db = require("quick.db");

module.exports = class PriorityList extends Command {
	constructor(client) {
		super(client, {
			name: "prioritylist",
			description: client.cmdConfig.prioritylist.description,
			usage: client.cmdConfig.prioritylist.usage,
			permissions: client.cmdConfig.prioritylist.permissions,
      aliases: client.cmdConfig.prioritylist.aliases,
			category: "tickets",
			listed: client.cmdConfig.prioritylist.enabled,
			slash: true,
      options: [{
        name: "user",
        type: "USER",
        description: "User to assign role to",
        required: true
      }]
		});
	}
  
  async run(message, args) {
    let config = this.client.config;
    let highContent = "";
    let urgentContent = "";
    let allHigh = db
      .all()
      .filter((i) => i.ID.startsWith(`priority_${message.guild.id}_`))
      .filter((d) => d.data.replace(/\"/g, "") == "high");
    let allUrgent = db
      .all()
      .filter((i) => i.ID.startsWith(`priority_${message.guild.id}_`))
      .filter((d) => d.data.replace(/\"/g, "") == "urgent");

    highContent = allHigh.map((x, i) => `<#${x.ID.split("_")[2]}>`).join(", ").trim();
    urgentContent = allUrgent.map((x, i) => `<#${x.ID.split("_")[2]}>`).join(", ").trim();

    if(allHigh.length == 0) highContent = this.client.language.ticket.priority.no_high;
    else if(allUrgent.length == 0) urgentContent = this.client.language.ticket.priority.no_urgent;

    message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.ticket.priority.list.replace("<urgent>", urgentContent).replace("<high>", highContent), this.client.embeds.success_color)] });
  }
	async slashRun(interaction, args) {
    let config = this.client.config;
    let highContent = "";
    let urgentContent = "";
    let allHigh = db
      .all()
      .filter((i) => i.ID.startsWith(`priority_${interaction.guild.id}_`))
      .filter((d) => d.data.replace(/\"/g, "") == "high");
    let allUrgent = db
      .all()
      .filter((i) => i.ID.startsWith(`priority_${interaction.guild.id}_`))
      .filter((d) => d.data.replace(/\"/g, "") == "urgent");

    highContent = allHigh.map((x, i) => `<#${x.ID.split("_")[2]}>`).join(", ").trim();
    urgentContent = allUrgent.map((x, i) => `<#${x.ID.split("_")[2]}>`).join(", ").trim();

    if(allHigh.length == 0) highContent = this.client.language.ticket.priority.no_high;
    else if(allUrgent.length == 0) urgentContent = this.client.language.ticket.priority.no_urgent;

    interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.priority.list.replace("<urgent>", urgentContent).replace("<high>", highContent), this.client.embeds.success_color)], ephemeral: this.client.cmdConfig.prioritylist.ephemeral });
	}
};