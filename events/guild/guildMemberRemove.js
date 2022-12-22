const Discord = require("discord.js");
const Event = require("../../structures/Events");

module.exports = class GuildMemberRemove extends Event {
	constructor(...args) {
		super(...args);
	}

	async run(member) {
	  let config = this.client.config;
    if(this.client.config.general.remove_leave == true) {
      let guild = this.client.guilds.cache.get(config.general.guild);
      let findChannel = guild.channels.cache.find((c) => c.name == config.channels.channel_name.toLowerCase() + this.client.utils.ticketUsername(member.user));
      if(!findChannel) return;
      await findChannel.delete("User Left");
    }
  }
};