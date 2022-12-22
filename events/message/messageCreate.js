const Discord = require("discord.js");
const Event = require("../../structures/Events");
const db = require("quick.db");

let cooldownList = [];

module.exports = class Message extends Event {
	constructor(...args) {
		super(...args);
	}

	async run(message) {
    if (message.channel.type === "DM") return;
    let prefix = this.client.config.general.prefix;

    if (message.author.bot) return;

    if(this.client.config.autoResponse.enabled == true) {
      if(Object.keys(this.client.config.autoResponse.list).some(w => message.content.toLowerCase().includes(w.toLowerCase()) || message.content.toLowerCase().startsWith(w.toLowerCase()))) {
        let rWord = Object.keys(this.client.config.autoResponse.list).filter(w => Object.keys(this.client.config.autoResponse.list).some(a => message.content.toLowerCase().includes(w.toLowerCase())));
        let respIndex = Object.keys(this.client.config.autoResponse.list).indexOf(rWord[0]);
        
        let resp = Object.values(this.client.config.autoResponse.list)[respIndex];
        
        if(this.client.config.autoResponse.type == "EMBED") {
          let respEmbed = new Discord.MessageEmbed()
            .setTitle(this.client.language.titles.auto_response)
            .setColor(this.client.embeds.general_color)
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp()
            .setDescription(this.client.language.general.auto_response.replace("<user>", message.author)
              .replace("<response>", resp));
            
          message.reply({ embeds: [respEmbed] });
        } else if(this.client.config.autoResponse.type == "TEXT") {
          message.reply({ content: resp });
        } else {
          this.client.utils.sendError("Invalid Message Type for Auto Response Message Provided.");
        }
      } 
    }

    if(message.channel.name.includes(this.client.config.channels.channel_name)) {
      let opened = db.fetch(`openedAt_${message.channel.id}`);
      let ticketOwner = db.fetch(`ticketOwner_${message.channel.id}`);
      if(opened != null && ticketOwner != null && ticketOwner != message.author.id && message.author.bot == false) {
        let now = new Date();
        let creationDate = (new Date(opened).getTime());
        let started = creationDate || new Date().getTime();
        let timeDiff = now.getTime() - started;
  
        let recentResp = db.fetch(`recentResponse_${message.guild.id}_${message.author.id}`) || [];
        recentResp.unshift(timeDiff);
        let totalResp = db.fetch(`totalResponse_${message.guild.id}_${message.author.id}`) || [];
        totalResp.unshift(timeDiff);
        db.set(`recentResponse_${message.guild.id}_${message.author.id}`, recentResp);
        db.set(`totalResponse_${message.guild.id}_${message.author.id}`, totalResp);
        db.set(`autoClaim_${message.channel.id}`, `${message.author.id}`);
        db.delete(`openedAt_${message.channel.id}`);
      }
    }

    // <== Commands ==> //
    const prefixMention = new RegExp(`^<@!?${this.client.user.id}> `);
    if (message.content.indexOf(prefix) != 0 && !message.content.match(prefixMention)) return;
  
    prefix = message.content.match(prefixMention) ? message.content.match(prefixMention)[0] : this.client.config.general.prefix;

    const args = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/g);
    const command = args.shift().toLowerCase();
    
    let cmd = this.client.commands.get(command);
    if (!cmd) cmd = this.client.commands.get(this.client.aliases.get(command));
    if(!cmd) return;

    if(this.client.utils.permissionsLength(message, message.member, cmd.permissions) > 0 && !this.client.utils.hasRole(this.client, message.guild, message.member, this.client.config.roles.bypass.permission)) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.no_perm, this.client.embeds.error_color)] });

    if(this.client.cmdConfig[cmd.name]) {
      let cmdConfig = this.client.cmdConfig[cmd.name];
      if(cmdConfig.enabled == false) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.cmd_disabled, this.client.embeds.error_color)] });
      if(cmdConfig && cmdConfig.roles.length > 0 && !this.client.utils.hasRole(this.client, message.guild, message.member, this.client.config.roles.bypass.permission)) {
        let cmdRoles = cmdConfig.roles.map((x) => this.client.utils.findRole(message.guild, x));
        if(!this.client.utils.hasRole(this.client, message.guild, message.member, cmdConfig.roles)) return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.no_role.replace("<role>", cmdRoles.join(", ").trim()), this.client.embeds.error_color)] });
      }
      let findCooldown = cooldownList.find((c) => c.name == cmd.name && c.id == message.author.id);
      if(!this.client.utils.hasRole(this.client, message.guild, message.member, this.client.config.roles.bypass.cooldown, true)) {
        if(findCooldown) {
          let time = this.client.utils.formatTime(findCooldown.expiring - Date.now());
          return message.channel.send({ embeds: [this.client.embedBuilder(this.client, message.author, this.client.embeds.title, this.client.language.general.cooldown.replace("<cooldown>", time), this.client.embeds.error_color)] });
        } else if(!findCooldown && this.client.cmdConfig[cmd.name].cooldown > 0) {
          let cooldown = {
            id: message.author.id,
            name: cmd.name,
            expiring: Date.now() + (this.client.cmdConfig[cmd.name].cooldown * 1000),
          };
  
          cooldownList.push(cooldown);
  
          setTimeout(() => {
            cooldownList.splice(cooldownList.indexOf(cooldown), 1);
          }, this.client.cmdConfig[cmd.name].cooldown * 1000);
        }
      }
    }

    cmd.run(message, args).then(() => {
      if(this.client.config.general.remove_command == true) message.delete()
    });
	}
};