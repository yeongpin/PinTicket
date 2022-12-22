const Event = require("../../structures/Events");
const Discord = require("discord.js");
const db = require("quick.db");
const chalk = require("chalk");
const { channelRoleCheck, filesCheck } = require("../../utils/utils.js");

module.exports = class Ready extends Event {
	constructor(client) {
	  super(client, "ready");
		this.client = client;
	}

	async run() {
		const config = this.client.config;
		let usedGuild = this.client.guilds.cache.get(config.general.guild);
		let error = false;
		let foundErrors = [];
		let foundWarn = [];
		
		//== Look for Missing Directories and Files ==//
		filesCheck();
		
		let nodeVersions = [
			"16.6", 
			"16.7", 
			"16.8", 
			"16.9", 
			"16.10", 
			"16.11", 
			"16.12", 
			"16.13", 
			"16.14", 
			"17.0", 
			"17.1", 
			"17.2", 
			"17.3",
			"17.4",
			"17.5",
			"17.6",
			"17.7",
			"17.8"
		];
		
		if(!nodeVersions.some((v) => process.version.includes(v))) {
		  error = true;
			this.client.utils.sendError("Detected NodeJS Version (" + process.version + ") but expected v16.6+. Please Upgrade.");
			foundErrors.push("UnSupported NodeJS Version");
		}
		
		if(!this.client.config.general.guild || !this.client.guilds.cache.get(this.client.config.general.guild)) {
			error = true;
			this.client.utils.sendError("Config Field (general.guild) contains invalid Guild ID. Slash Commands won't work properly without this!");
			foundErrors.push("Invalid Guild ID");
		}

		//== Look for Invalid Channel & Roles in Config ==//
		channelRoleCheck(this.client, usedGuild, foundWarn);

		let totalTickets = 0, currentTickets = 0;		
		
		if (usedGuild && config.general.guild != "") {
		  currentTickets = [...usedGuild.channels.cache.filter(c => c.name.startsWith(this.client.config.channels.channel_name)).values()].length;
		  totalTickets = db.fetch(`ticket_${usedGuild.id}`) || 0;
		}
		
		setInterval(() => {
		  if (usedGuild && config.general.guild != "") {
		    currentTickets = [...usedGuild.channels.cache.filter(c => c.name.startsWith(this.client.config.channels.channel_name)).values()].length;
		    totalTickets = db.fetch(`ticket_${usedGuild.id}`) || 0;
		  }
		}, 120000);
		
		if(config.autoAnnounce.enabled == true) {
		  setInterval(() => {
		    const annRand = Math.floor(Math.random() * (config.autoAnnounce.list.length - 1) + 1);
  		  if (this.client.config.autoAnnounce.type == "EMBED") {
  		    let annEmbed = new Discord.MessageEmbed()
  		      .setTitle(this.client.language.titles.auto_announce)
  		      .setColor(this.client.embeds.general_color)
						.setFooter({ text: this.client.embeds.footer, iconURL: this.client.user.displayAvatarURL({ dynamic: true }) })
						.setTimestamp()
  		      .setDescription(this.client.language.general.auto_announce.replace("<message>", this.client.config.autoAnnounce.list[annRand]));
  
					let annChannel = this.client.utils.findChannel(usedGuild, config.channels.announce);
  		    annChannel.send({ embeds: [annEmbed] });
  		  } else if (this.client.config.autoAnnounce.type == "TEXT") {
  		    let annChannel = this.client.utils.findChannel(usedGuild, config.channels.announce);
  		    annChannel.send({ content: this.client.config.autoAnnounce.list[annRand] });
  		  } else {
  		    this.client.utils.sendWarn("Invalid Message Type for Auto Announcements Message Provided.");
  		  }
		  }, config.autoAnnounce.interval * 1000);
		}
		
		if(config.status.change_random == true) {
			const rand = Math.floor(Math.random() * (config.status.messages.length - 1) + 1);
      
			this.client.user.setActivity(config.status.messages[rand].replace("<members>", this.client.users.cache.size)
			  .replace("<channels>", this.client.channels.cache.size)
			  .replace("<currentTickets>", currentTickets)
			  .replace("<totalTickets>", totalTickets), { type: config.status.type });
			
			setInterval(() => {
				const index = Math.floor(Math.random() * (config.status.messages.length - 1) + 1);
					this.client.user.setActivity(config.status.messages[index].replace("<members>", this.client.users.cache.size)
			      .replace("<channels>", this.client.channels.cache.size)
			      .replace("<currentTickets>", currentTickets)
			      .replace("<totalTickets>", totalTickets), { type: config.status.type });
			}, config.status.interval * 1000);
		} else {
			this.client.user.setActivity(this.client.config.status.message.replace("<members>", this.client.users.cache.size)
			  .replace("<channels>", this.client.channels.cache.size)
			  .replace("<currentTickets>", currentTickets)
			  .replace("<totalTickets>", totalTickets), { type: this.client.config.status.type });
		}
		this.client.guilds.cache.forEach((g) => {
			setInterval(() => {
				this.client.utils.updateStats(this.client, g)
			}, 30000)
		});

    if(this.client.config.general.slash == true) {
			try {
				await this.client.guilds.cache.get(this.client.config.general.guild).commands.set(this.client.slashArray); 
				// await this.client.application.commands.set([]);
			} catch(e) {
				error = true;
				this.client.utils.sendError("Bot haven't been invited with applications.commands scope. Please ReInvite Bot with Required Scope(s).");
				foundErrors.push("Invalid Scopes");
			}
    } else {
			try {
				await this.client.guilds.cache.get(this.client.config.general.guild).commands.set([]);
				// await this.client.application.commands.set([]);
			} catch(e) {
				error = true;
				this.client.utils.sendError("Bot haven't been invited with applications.commands scope. Please ReInvite Bot with Required Scope(s).");
				foundErrors.push("Invalid Scopes");
			}
    }

		if(error || foundErrors.length > 0) {
			console.log("");
			console.log(chalk.gray("▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃"));
			console.log("")
			console.log(chalk.red.bold(`${config.general.name.toUpperCase()} ${config.version.toUpperCase()}`));
			console.log("");
			console.log(chalk.white(`There was an error while starting bot, please look above for detailed error.`));
			console.log(chalk.white(`Bot should be online if it's not an important error.`));
			console.log("");
			console.log(chalk.red(`Startup Errors (${foundErrors.length}): `) + chalk.white(foundErrors.join(", ").trim() + "."));
			console.log("")
			console.log(chalk.gray("▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃"));
			console.log(" ");
		} else {
			let addons = chalk.greenBright(`Loaded Addons (${this.client.addonList.length}): `) + chalk.white(this.client.addonList.join(", ") + ".");
			let warns = chalk.keyword("orange")(`Startup Warnings (${foundWarn.length}): `) + chalk.white(foundWarn.join(", ").trim() + ".");
			
			console.log("");
			console.log(chalk.gray("▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃"));
			console.log("")
			console.log(chalk.blue.bold(`${config.general.name.toUpperCase()} ${config.version.toUpperCase()}`));
			console.log("");
			console.log(chalk.white(`Thank you for your purchase, bot has started and is online now!`));
			console.log("")
			console.log(this.client.addonList.length > 0 ? addons : "No Addons Loaded");
			console.log(foundWarn.length > 0 ? warns : "No Warnings or Errors on startup, good job!")
			console.log("")
			console.log(chalk.gray("▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃"));
			console.log(" ");
		}
	}
};
