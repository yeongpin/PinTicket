const Discord = require("discord.js");
const db = require("quick.db");
const Event = require("../../structures/Events");
const { textTranscript, htmlTranscript } = require("../../utils/createTranscript.js");
const askReview = require("../../utils/askReview.js");

let cooldownList = [];

module.exports = class InteractionCreate extends Event {
	constructor(...args) {
		super(...args);
	}

	async run(interaction) {
    const message = interaction.message;
    const user = interaction.user;
    const config = this.client.config;
    const language = this.client.language;
    if(user.bot) return;
    if (interaction.isCommand()) {
      const cmd = this.client.slashCommands.get(interaction.commandName);
      if (!cmd) return interaction.reply({ content: "> Error occured, please contact Bot Owner.", ephemeral: true });

      interaction.member = interaction.guild.members.cache.get(interaction.user.id);
      
      if(this.client.utils.permissionsLength(interaction, interaction.member, cmd.permissions) > 0 && !this.client.utils.hasRole(this.client, interaction.guild, interaction.member, this.client.config.roles.bypass.permission)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.language.titles.error, this.client.language.general.no_perm, this.client.embeds.error_color)], ephemeral: true });

      const args = [];
      for (let option of interaction.options.data) {
        if (option.type === "SUB_COMMAND") {
          if (option.name) args.push(option.name);
          option.options?.forEach((x) => {
            if (x.value) args.push(x.value);
          });
        } else if (option.value) args.push(option.value);
      }

      if(this.client.cmdConfig[cmd.name]) {
        let cmdConfig = this.client.cmdConfig[cmd.name];
        if(cmdConfig.enabled == false) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.cmd_disabled, this.client.embeds.error_color)] });
        if(cmdConfig && cmdConfig.roles.length > 0 && !this.client.utils.hasRole(this.client, interaction.guild, interaction.member, this.client.config.roles.bypass.permission)) {
          let cmdRoles = cmdConfig.roles.map((x) => this.client.utils.findRole(interaction.guild, x));
          if(!this.client.utils.hasRole(this.client, interaction.guild, interaction.member, cmdConfig.roles)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.no_role.replace("<role>", cmdRoles.join(", ")), this.client.embeds.error_color)], ephemeral: true });
        }
        let findCooldown = cooldownList.find((c) => c.name == cmd.name && c.id == interaction.user.id);
        if(!this.client.utils.hasRole(this.client, interaction.guild, interaction.member, this.client.config.roles.bypass.cooldown, true)) {
          if(findCooldown) {
            let time = this.client.utils.formatTime(findCooldown.expiring - Date.now());
            return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.cooldown.replace("<cooldown>", time), this.client.embeds.error_color)], ephemeral: true });
          } else if(!findCooldown && this.client.cmdConfig[cmd.name].cooldown > 0) {
            let cooldown = {
              id: interaction.user.id,
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

      cmd.slashRun(interaction, args);
    }
    if (interaction.isButton()) {
      if(interaction.customId.startsWith("createTicket")) {
        await interaction.deferUpdate();
        let blackListed = false;
        let member = interaction.guild.members.cache.get(user.id);
        for(let i = 0; i < config.roles.blacklist.length; i++) {
          if(member.roles.cache.has(config.roles.blacklist[i])) blackListed = true;
        }
        if(blackListed == true) 
          return interaction.followUp({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.bl_role, this.client.embeds.error_color)], ephemeral: true })
        if(config.users.blacklist.includes(user.id))
          return interaction.followUp({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.ticket.bl_user, this.client.embeds.error_color)], ephemeral: true })
        const noCategory = new Discord.MessageEmbed()
          .setTitle(this.client.embeds.title)
          .setDescription(this.client.language.ticket.no_category)
          .setFooter({ text: this.client.embeds.footer, iconURL: user.displayAvatarURL({ dynamic: true }) })
          .setTimestamp()
          .setColor(this.client.embeds.error_color);
  
        if(config.channels.category_id == "") 
          return interaction.followUp({ embeds: [noCategory], ephemeral: true });
  
        this.client.emit("ticketCreate", interaction, interaction.member, "No Reason", {
          status: interaction.customId.includes("_"),
          cat_id: interaction.customId.includes("_") ? `${interaction.customId.replace("createTicket_")}` : 'n/a'
        });
      }
  
      if(interaction.customId == "closeTicket" && interaction.user.bot == false) {
        await interaction.deferUpdate();
        let ticketID = db.fetch(`ticket_${interaction.guild.id}`);
        if(config.general.confirm_close == false) {
          interaction.followUp({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, language.ticket.ticket_deleted, this.client.embeds.general_color)] });
          await askReview(this.client, interaction.channel, interaction.guild);
          if(config.general.transcripts == true) {
            if(config.general.transcript_type == "HTML") {
              await htmlTranscript(this.client, interaction, `ticket-${ticketID}`, interaction);
            } else {
              await textTranscript(this.client, interaction, ticketID, interaction);
            }
            setTimeout(() => {
              let dataRemove = db
                .all()
                .filter((i) => i.ID.includes(interaction.channel.id));
        
              dataRemove.forEach((x) => db.delete(x.ID));
            }, 5000);
          } else {
            let dataRemove = db
              .all()
              .filter((i) => i.ID.includes(interaction.channel.id));
            dataRemove.forEach((x) => db.delete(x.ID));
            setTimeout(async() => {
              interaction.channel.delete();
            }, this.client.config.general.delete_after * 1000);
          }
          return;
        }
  
        this.client.emit("ticketClose", interaction, interaction.member);
      }
  
      // Suggestion Vote
      if(interaction.customId.startsWith("vote_") && interaction.guild) {
        let suggestionData = db.fetch(`suggestion_${interaction.guild.id}_${interaction.message.id}`);
        if(suggestionData) {
          let voteType = interaction.customId.split("_")[1].toLowerCase();
  
          if (voteType == "yes") {
            if (suggestionData.voters.some((u) => u.user == interaction.user.id)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.already_voted, this.client.embeds.error_color)], ephemeral: true });
            let newData = {
              text: suggestionData.text,
              date: suggestionData.date,
              decision: suggestionData.decision,
              author: suggestionData.author,
              yes: parseInt(suggestionData.yes) + 1,
              no: parseInt(suggestionData.no),
              voters: suggestionData.voters.concat({ user: interaction.user.id, type: "yes" }),
              status: 'none',
            };
            db.set(`suggestion_${interaction.guild.id}_${interaction.message.id}`, newData);
            interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.vote_yes, this.client.embeds.success_color)], ephemeral: true });
            await this.client.utils.updateSuggestionEmbed(this.client, interaction);
          } else if (voteType == "no") {
            if (suggestionData.voters.some((u) => u.user == interaction.user.id)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.already_voted, this.client.embeds.error_color)], ephemeral: true });
            let newData = {
              text: suggestionData.text,
              date: suggestionData.date,
              decision: suggestionData.decision,
              author: suggestionData.author,
              yes: parseInt(suggestionData.yes),
              no: parseInt(suggestionData.no) + 1,
              voters: suggestionData.voters.concat({ user: interaction.user.id, type: "no" }),
              status: 'none',
            };
            db.set(`suggestion_${interaction.guild.id}_${interaction.message.id}`, newData);
            interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.vote_no, this.client.embeds.success_color)], ephemeral: true });
            await this.client.utils.updateSuggestionEmbed(this.client, interaction);
          } else if (voteType == "reset") {
            if (!suggestionData.voters.some((u) => u.user == interaction.user.id)) return interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.not_voted, this.client.embeds.error_color)], ephemeral: true });
            let removeYes = suggestionData.voters.find((d) => d.type == "yes" && d.user == interaction.user.id);
            let removeNo = suggestionData.voters.find((d) => d.type == "no" && d.user == interaction.user.id);
  
            let newData = {
              text: suggestionData.text,
              date: suggestionData.date,
              decision: suggestionData.decision,
              author: suggestionData.author,
              yes: removeYes ? parseInt(suggestionData.yes) - 1 : parseInt(suggestionData.yes),
              no: removeNo ? parseInt(suggestionData.no) - 1 : parseInt(suggestionData.no),
              voters: suggestionData.voters.filter((v) => v.user != interaction.user.id),
              status: 'none',
            };
            db.set(`suggestion_${interaction.guild.id}_${interaction.message.id}`, newData);
            interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.vote_reset, this.client.embeds.success_color)], ephemeral: true });
            await this.client.utils.updateSuggestionEmbed(this.client, interaction);
          }
        }
      }
    }

    // Suggestion Decision
    if(interaction.isSelectMenu()) {
      let decisionData = db.fetch(`suggestionDecision_${interaction.guild.id}_${interaction.message.id}`);
      if(interaction.customId == "decision_menu" && decisionData && this.client.config.general.sugg_decision == true) {
        let suggChannel = this.client.utils.findChannel(interaction.guild, this.client.config.channels.suggestions);
        let fetchSuggestion = await suggChannel.messages.fetch(decisionData);
        if(!fetchSuggestion) return;
        let decidedChannel = this.client.utils.findChannel(interaction.guild, this.client.config.channels.sugg_logs);
        let value = interaction.values[0];

        if(value == "decision_accept") {
          let acceptEmbed = new Discord.MessageEmbed()
            .setTitle(this.client.language.titles.sugg_accepted)
            .setColor(this.client.embeds.success_color);
          
          if(fetchSuggestion.embeds[0].description) acceptEmbed.setDescription(fetchSuggestion.embeds[0].description);
          if(fetchSuggestion.embeds[0].footer) acceptEmbed.setFooter(fetchSuggestion.embeds[0].footer).setTimestamp();
          if(fetchSuggestion.embeds[0].thumbnail) acceptEmbed.setThumbnail(fetchSuggestion.embeds[0].thumbnail.url);
          if(fetchSuggestion.embeds[0].fields[0]) acceptEmbed.addFields(fetchSuggestion.embeds[0].fields);

          await interaction.message.delete();
          await fetchSuggestion.delete();
          decidedChannel.send({ embeds: [acceptEmbed] });
          interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.accepted, this.client.embeds.success_color)], ephemeral: true });
        } else if(value == "decision_deny") {
          let denyEmbed = new Discord.MessageEmbed()
            .setTitle(this.client.language.titles.sugg_denied)
            .setColor(this.client.embeds.error_color);

          if(fetchSuggestion.embeds[0].description) denyEmbed.setDescription(fetchSuggestion.embeds[0].description);
          if(fetchSuggestion.embeds[0].footer) denyEmbed.setFooter(fetchSuggestion.embeds[0].footer).setTimestamp();
          if(fetchSuggestion.embeds[0].thumbnail) denyEmbed.setThumbnail(fetchSuggestion.embeds[0].thumbnail.url);
          if(fetchSuggestion.embeds[0].fields[0]) denyEmbed.addFields(fetchSuggestion.embeds[0].fields);

          await interaction.message.delete();
          await fetchSuggestion.delete();
          decidedChannel.send({ embeds: [denyEmbed] });
          interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.denied, this.client.embeds.success_color)], ephemeral: true });
        } else if(value == "decision_delete") {
          await interaction.message.delete();
          await fetchSuggestion.delete();
          interaction.reply({ embeds: [this.client.embedBuilder(this.client, interaction.user, this.client.embeds.title, this.client.language.general.suggestions.deleted, this.client.embeds.success_color)], ephemeral: true });
          db.delete(`suggestion_${interaction.guild.id}_${decisionData}`);
        }
      }
    } 
	}
};
