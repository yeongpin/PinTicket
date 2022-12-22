const db = require("quick.db");
const Event = require("../../structures/Events");

module.exports = class ChannelDelete extends Event {
	constructor(...args) {
		super(...args);
	}

	async run(channel) {
	  if(!channel.guild.me.permissions.has("MANAGE_GUILD")) return;
    if(!channel.guild) return;

		let dataRemove = db
			.all()
			.filter((i) => i.ID.includes(channel.id));

		let dataRemoveExtra = db
			.all()
			.filter((i) => `${i.data}`.includes(channel.id));

		dataRemove.forEach((x) => db.delete(x.ID));
		dataRemoveExtra.forEach((x) => db.delete(x.ID));
	} 
};