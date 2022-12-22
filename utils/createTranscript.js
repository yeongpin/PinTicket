const Discord = require("discord.js");
const db = require("quick.db");
const fs = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM();
const document = dom.window.document;

const htmlTranscript = async (client, message, ticket, interaction) => {
  let config = client.config;
  let author = db.fetch(`ticketOwner_${interaction.channel.id}`);
  let openedTimestamp = db.fetch(`openedTimestamp_${interaction.channel.id}`);
  let messageCollection = new Discord.Collection();
  let channelMessages = await message.channel.messages.fetch({ limit: 100 });

  messageCollection = messageCollection.concat(channelMessages);

  while(channelMessages.size === 100) {
    let lastMessageId = channelMessages.lastKey();
    channelMessages = await message.channel.messages.fetch({ limit: 100, before: lastMessageId });
    if(channelMessages) messageCollection = messageCollection.concat(channelMessages);
  }
  
  let msgs = [...messageCollection.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  let data = await fs.readFileSync('./data/template.html', {
    encoding: 'utf-8'
  });
  if(data) {
    await fs.writeFileSync(`transcripts/${ticket}.html`, data)
    let guildElement = document.createElement('div');

    let guildNameEl = document.createElement("span");
    let guildText = document.createTextNode(message.guild.name);
    guildNameEl.appendChild(guildText);
    guildNameEl.style = `margin-left: 43px`
    guildNameEl.style = `margin-top: 65px`

    let guildImg = document.createElement('img');
    guildImg.setAttribute('src', message.guild.iconURL());
    guildImg.setAttribute('width', '128');
    guildImg.className = "guild-image";
    guildElement.appendChild(guildImg);
    guildElement.appendChild(guildNameEl);
    guildElement.style = "display: flex"
    await fs.appendFile(`transcripts/${ticket}.html`, guildElement.outerHTML, (err) => {
      if(err) console.log(err)
    });

    msgs.forEach(async msg => {
      let parentContainer = document.createElement("div");
      parentContainer.className = "parent-container";

      let avatarDiv = document.createElement("div");
      avatarDiv.className = "avatar-container";
      let img = document.createElement('img');
      img.setAttribute('src', msg.author.displayAvatarURL());
      img.className = "avatar";
      avatarDiv.appendChild(img);

      parentContainer.appendChild(avatarDiv);

      let messageContainer = document.createElement('div');
      messageContainer.className = "message-container";

      let nameElement = document.createElement("span");
      let name = document.createTextNode(`${msg.author.tag} ${msg.createdAt.toLocaleString()}`)
      nameElement.appendChild(name);
      nameElement.style = `padding-bottom: 10px`
      messageContainer.append(nameElement);

      if(msg.content.startsWith("```")) {
        let m = msg.content.slice(3, -3);
        let codeNode = document.createElement("code");
        let textNode =  document.createTextNode(m);
        codeNode.appendChild(textNode);
        messageContainer.appendChild(codeNode);
      } else if(msg.embeds[0]) {
        let fields = [];
        for(let i = 0; i < msg.embeds[0].fields.length; i++) {
          fields.push(
            `<b><font size="+1">${msg.embeds[0].fields[i].name}</font></b><br>${msg.embeds[0].fields[i].value}<br>`
          )
        }
        let msgEmbed = msg.embeds[0];
        let embedNode = document.createElement("div");
        embedNode.className = "embed";

        let colorNode = document.createElement("div");
        colorNode.className = "embed-color";
        colorNode.style = `background-color: ${msgEmbed.hexColor}`;
        embedNode.appendChild(colorNode);
        let embedContent = document.createElement("div");
        embedContent.className = "embed-content";

        let titleNode = document.createElement("span");
        titleNode.className = "embed-title";
        titleNode.innerHTML = msgEmbed.title;
        embedContent.appendChild(titleNode);

        if(msgEmbed.fields[0]) {
          let descNode = document.createElement("span");
          if(msgEmbed.description) {
            let boldContent = msgEmbed.description.match(/\*\*([^]*?)\*\*/g);
            let boldReg = /\*/g;
            if(boldContent) boldContent.forEach((x) => msgEmbed.description = msgEmbed.description.replace(x, `<b>${x.replace(boldReg, '')}</b>`))
          }
          let fieldDes = msgEmbed.description ? msgEmbed.description : '';
          descNode.className = "embed-description";
          descNode.innerHTML = fieldDes + '\n' + fields.join("<br>");
          embedContent.appendChild(descNode);
        } else {
          if(!msgEmbed.description) msgEmbed.description = "";
          let descNode = document.createElement("span");
          descNode.className = "embed-description";
          let boldContent = msgEmbed.description.match(/\*\*([^]*?)\*\*/g);
          let boldReg = /\*/g;
          if(boldContent) boldContent.forEach((x) => msgEmbed.description = msgEmbed.description.replace(x, `<b>${x.replace(boldReg, '')}</b>`))

          descNode.innerHTML = msgEmbed.description.replace("\n", "<br>");
          embedContent.appendChild(descNode);
        }
        embedNode.appendChild(embedContent);
        messageContainer.append(embedNode);
      } else {
        let msgNode = document.createElement('span');
        let textNode = document.createTextNode(msg.content);
        msgNode.append(textNode);
        messageContainer.appendChild(msgNode);
      }
      parentContainer.appendChild(messageContainer);
      await fs.appendFile(`transcripts/${ticket}.html`, parentContainer.outerHTML, (err) => {
        if(err) console.log(err)
      }); 
    });
    let path = `./transcripts/${ticket}.html`;
    
    let logEmbed = new Discord.MessageEmbed()
      .setColor(client.embeds.transcriptLog.color);

    if (client.embeds.transcriptLog.title) logEmbed.setTitle(client.embeds.transcriptLog.title);
    let field = client.embeds.transcriptLog.fields;
    for (let i = 0; i < client.embeds.transcriptLog.fields.length; i++) {
      logEmbed.addField(field[i].title, field[i].description.replace("<closedBy>", interaction.member.user)
        .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
        .replace("<author>", `<@${author}>`)
        .replace("<channelId>", interaction.channel.id)
        .replace("<channelName>", interaction.channel.name)
        .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
        .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`))
    }

    if (client.embeds.transcriptLog.footer == true) logEmbed.setFooter({ text: message.member.user.username, iconURL: message.member.user.displayAvatarURL() }).setTimestamp();
    if (client.embeds.transcriptLog.thumbnail == true) logEmbed.setThumbnail(message.member.user.displayAvatarURL());

    if (client.embeds.transcriptLog.description) logEmbed.setDescription(client.embeds.transcriptLog.description.replace("<closedBy>", interaction.member.user)
      .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
      .replace("<author>", `<@${author}>`)
      .replace("<channelId>", interaction.channel.id)
      .replace("<channelName>", interaction.channel.name)
      .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
      .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`));
    
    let aChannel = client.utils.findChannel(message.guild, config.channels.transcripts);
    aChannel.send({ embeds: [logEmbed], files: [path] }).then(() => {
      setTimeout(() => {
        if(message.channel) message.channel.delete();
      }, client.config.general.delete_after * 1000);
    }); 

    if(config.general.dm_transcript == true) {
      let dmEmbed = new Discord.MessageEmbed()
        .setColor(client.embeds.dmTranscript.color);

      if(client.embeds.dmTranscript.title) dmEmbed.setTitle(client.embeds.dmTranscript.title);
      let field = client.embeds.dmTranscript.fields;
      for(let i = 0; i < client.embeds.dmTranscript.fields.length; i++) {
        dmEmbed.addField(field[i].title, field[i].description.replace("<closedBy>", interaction.member.user)
          .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
          .replace("<author>", `<@${author}>`)
          .replace("<channelId>", interaction.channel.id)
          .replace("<channelName>", interaction.channel.name)
          .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
          .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`))
      }
      
      if(client.embeds.dmTranscript.footer == true) dmEmbed.setFooter({ text: message.member.user.username, iconURL: message.member.user.displayAvatarURL() }).setTimestamp();
      if(client.embeds.dmTranscript.thumbnail == true) dmEmbed.setThumbnail(message.member.user.displayAvatarURL());

      if(client.embeds.dmTranscript.description) dmEmbed.setDescription(client.embeds.dmTranscript.description.replace("<closedBy>", interaction.member.user)
        .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
        .replace("<author>", `<@${author}>`)
        .replace("<channelId>", interaction.channel.id)
        .replace("<channelName>", interaction.channel.name)
        .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
        .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`));

      if(config.general.dm_transcript == true) {
        let authorDM = db.fetch(`ticketOwner_${message.channel.id}`);
        let supportDM = db.fetch(`ticketClaimed_${message.channel.id}`);
        authorDM = client.users.cache.get(authorDM);
        supportDM = client.users.cache.get(supportDM);
        if(authorDM != undefined) {
          authorDM.send({ embeds: [dmEmbed], files: [path] }).catch((err) => {
            console.error("Author's DM Closed");
          });
        }
        if(supportDM != undefined && supportDM != authorDM) {
          supportDM.send({ embeds: [dmEmbed], files: [path] }).catch((err) => {
            console.error("Support's DM Closed");
          });
        }
      };
    };
    let dataRemove = db
      .all()
      .filter((i) => i.ID.includes(message.channel.id));

    dataRemove.forEach((x) => db.delete(x.ID));
  }
}

const textTranscript = async (client, message, ticket, interaction) => {
  let config = client.config;
  let author = db.fetch(`ticketOwner_${interaction.channel.id}`);
  let openedTimestamp = db.fetch(`openedTimestamp_${interaction.channel.id}`);
  let write = fs.createWriteStream(`transcripts/ticket-${ticket}.txt`);
  message.channel.messages.fetch({ limit: 100 }).then((messages) => {
    let messages2 = messages;
    let me = messages2.sort((b, a) => b.createdTimestamp - a.createdTimestamp);

    me.forEach((msg) => {
      const time = msg.createdAt.toLocaleString();
      write.write(`[${time}] ${msg.author.tag}: ${msg.content}\n`);
    });
    write.end();
    
    let logEmbed = new Discord.MessageEmbed()
      .setColor(client.embeds.transcriptLog.color);

    if (client.embeds.transcriptLog.title) logEmbed.setTitle(client.embeds.transcriptLog.title);
    let field = client.embeds.transcriptLog.fields;
    for (let i = 0; i < client.embeds.transcriptLog.fields.length; i++) {
      logEmbed.addField(field[i].title, field[i].description.replace("<closedBy>", interaction.member.user)
        .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
        .replace("<author>", `<@${author}>`)
        .replace("<channelId>", interaction.channel.id)
        .replace("<channelName>", interaction.channel.name)
        .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
        .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`))
    }

    if (client.embeds.transcriptLog.footer == true) logEmbed.setFooter({ text: message.member.user.username, iconURL: message.member.user.displayAvatarURL() }).setTimestamp();
    if (client.embeds.transcriptLog.thumbnail == true) logEmbed.setThumbnail(message.member.user.displayAvatarURL());

    if (client.embeds.transcriptLog.description) logEmbed.setDescription(client.embeds.transcriptLog.description.replace("<closedBy>", interaction.member.user)
      .replace("<ticketId>", `${ticket}`.replace("ticket-", ""))
      .replace("<author>", `<@${author}>`)
      .replace("<channelId>", interaction.channel.id)
      .replace("<channelName>", interaction.channel.name)
      .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
      .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`));
    
    let aChannel = client.utils.findChannel(message.guild, config.channels.transcripts);
    aChannel.send({ embeds: [logEmbed], files: [`transcripts/ticket-${ticket}.txt`] }).then(() => {
      setTimeout(() => {
        if(message.channel) message.channel.delete();
      }, client.config.general.delete_after * 1000);
    }); 

    if(config.general.dm_transcript == true) {
      let dmEmbed = new Discord.MessageEmbed()
        .setColor(client.embeds.dmTranscript.color);

      if(client.embeds.dmTranscript.title) dmEmbed.setTitle(client.embeds.dmTranscript.title);
      let field = client.embeds.dmTranscript.fields;
      for(let i = 0; i < client.embeds.dmTranscript.fields.length; i++) {
        dmEmbed.addField(field[i].title, field[i].description.replace("<closedBy>", interaction.member.user)
          .replace("<ticketId>", ticket)
          .replace("<author>", `<@${author}>`)
          .replace("<channelId>", interaction.channel.id)
          .replace("<channelName>", interaction.channel.name)
          .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
          .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`))
      }
      
      if(client.embeds.dmTranscript.footer == true) dmEmbed.setFooter({ text: message.member.user.username, iconURL: message.member.user.displayAvatarURL() }).setTimestamp();
      if(client.embeds.dmTranscript.thumbnail == true) dmEmbed.setThumbnail(message.member.user.displayAvatarURL());

      if(client.embeds.dmTranscript.description) dmEmbed.setDescription(client.embeds.dmTranscript.description.replace("<closedBy>", interaction.member.user)
        .replace("<ticketId>", ticket)
        .replace("<author>", `<@${author}>`)
        .replace("<channelId>", interaction.channel.id)
        .replace("<channelName>", interaction.channel.name)
        .replace("<openedAt>", `<t:${Math.round(openedTimestamp/1000)}:F>`)
        .replace("<closedAt>", `<t:${Math.round(interaction.createdTimestamp/1000)}:F>`));

      if(config.general.dm_transcript == true) {
        let authorDM = db.fetch(`ticketOwner_${message.channel.id}`);
        let supportDM = db.fetch(`ticketClaimed_${message.channel.id}`);
        authorDM = client.users.cache.get(authorDM);
        supportDM = client.users.cache.get(supportDM);
        if(authorDM != undefined) {
          authorDM.send({ embeds: [dmEmbed], files: [`transcripts/ticket-${ticket}.txt`] }).catch((err) => {
            console.error("Author's DM Closed");
          });
        }
        if(supportDM != undefined && supportDM != authorDM) {
          supportDM.send({ embeds: [dmEmbed], files: [`transcripts/ticket-${ticket}.txt`] }).catch((err) => {
            console.error("Support's DM Closed");
          });
        }
      };
    };
    let dataRemove = db
      .all()
      .filter((i) => i.ID.includes(message.channel.id));

    dataRemove.forEach((x) => db.delete(x.ID));
  });
}

module.exports = {
  htmlTranscript,
  textTranscript,
}
