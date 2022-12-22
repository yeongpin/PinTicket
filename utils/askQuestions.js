const Discord = require("discord.js");
const db = require("quick.db");
const fetch = require("node-fetch")

const categoryCollector = async(client, member, category, channel) => {
  let config = client.config;
  let answersList = new Map();
  let finalList = new Map();
  let questionsList = category.questionsList;
  if(questionsList.length == 0) return;

  const filter = msg => msg.author.id === member.id;

  const collector = channel.createMessageCollector({ filter, idle: client.config.general.question_idle * 1000, max: questionsList.length });
  let questionNumber = 0;

  const cancelAsk = new Discord.MessageActionRow()
    .addComponents(
      new Discord.MessageButton().setCustomId("cancel_ask")
        .setEmoji("❌")
        .setStyle("DANGER")
    );

  let questionEmbed = new Discord.MessageEmbed()
    .setTitle(`${questionsList[questionNumber].name}`)
    .setDescription(`${questionsList[questionNumber].question}`)
    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp()
    .setColor(client.embeds.general_color);
    
  let msg = await channel.send({ embeds: [questionEmbed], components: client.config.general.cancel_ask == true ? [cancelAsk] : [] });
    
  if(client.config.general.cancel_ask == true) {
    const awaitFilter = (i) => i.customId == "cancel_ask" && i.user.id == member.id;
    
    msg.awaitMessageComponent({ awaitFilter }).then(async (i) => {
      await i.deferUpdate();
      await msg.delete();
      collector.stop();
    }).catch((e) => {});
  }

  let content = "";
  collector.on('collect', async(m) => {
    if(m.content.length >= 1024) content = `${m.content.slice(0, 1021)}..`;
    else content = m.content;

    if(m.attachments.size > 0) {
      let attUrls = "";
      
      for(const att of m.attachments) {
        let uploaded = await uploadImage(att[1].url);
        attUrls += `\n` + uploaded.image.url;
      }

      if(m.content.length == 0) content = attUrls;
      else content += `\n\n` + attUrls;
    }

    answersList.set(questionsList[questionNumber].name, `${content}`);
    questionNumber++;
    m.delete();
    if(questionNumber < questionsList.length) {
      questionEmbed.setTitle(questionsList[questionNumber].name);
      questionEmbed.setDescription(questionsList[questionNumber].question);
      await msg.edit({ embeds: [questionEmbed], components: client.config.general.cancel_ask == true ? [cancelAsk] : [] });
    } else if(questionNumber == questionsList.length) {
      finalList = new Map(answersList)
      questionEmbed.setTitle(client.language.titles.answers);
      questionEmbed.setDescription(client.language.ticket.loading_answers);
      await msg.edit({ embeds: [questionEmbed], components: [] });

      let ansList = [];
      let answersArray = [...answersList.values()];
      let qAnswers = new Discord.MessageEmbed()
        .setTitle(client.language.titles.answers)
        .setColor(client.embeds.general_color)
        .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      for(let i = 0; i < answersArray.length; i++) {
        qAnswers.addField(questionsList[i].name, answersArray[i]);
        ansList.push({
          question: questionsList[i].name,
          answer: answersArray[i]
        });
      }

      db.set(`channelQuestions_${channel.id}`, ansList);

      await msg.edit({ embeds: [qAnswers], components: [] });
      collector.stop();
    }
  });

  collector.on('end', async (collected, reason) => {
    if(reason.toLowerCase() == "idle") {
      let idleEmbed = new Discord.MessageEmbed()
        .setDescription(client.language.ticket.question_idle)
        .setColor(client.embeds.general_color);
        
      channel.send({ embeds: [idleEmbed] });
    }
  });
}

const generalCategory = async(client, member, channel) => {
  let config = client.config;
  let answersList = new Map();
  let questionsList = config.category.questionsList;
  if(questionsList.length == 0) return;

  const filter = msg => msg.author.id === member.id;

  const collector = channel.createMessageCollector({ filter, idle: client.config.general.question_idle * 1000, max: questionsList.length });
  let questionNumber = 0;

  const cancelAsk = new Discord.MessageActionRow()
    .addComponents(
      new Discord.MessageButton().setCustomId("cancel_ask")
        .setEmoji("❌")
        .setStyle("DANGER")
    );

  let questionEmbed = new Discord.MessageEmbed()
    .setTitle(`${questionsList[questionNumber].name}`)
    .setDescription(`${questionsList[questionNumber].question}`)
    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp()
    .setColor(client.embeds.general_color);
  let msg = await channel.send({ embeds: [questionEmbed], components: client.config.general.cancel_ask == true ? [cancelAsk] : [] });

  if(client.config.general.cancel_ask == true) {
    let awaitFilter = (i) => i.customId == "cancel_ask" && i.user.id == member.id;

    msg.awaitMessageComponent({ awaitFilter }).then(async(i) => {
      await i.deferUpdate();
      await msg.delete();
      collector.stop();
    });
  }

  let content = "";
  collector.on('collect', async(m) => {
    if(m.content.length >= 1024) content = `${m.content.slice(0, 1021)}..`;
    else content = m.content;

    if(m.attachments.size > 0) {
      let attUrls = "";
      for(const att of m.attachments) {
        let uploaded = await uploadImage(att[1].url);
        attUrls += `\n` + uploaded.image.url;
      }

      if(m.content.length == 0) content = attUrls;
      else content += `\n\n` + attUrls;
    }

    answersList.set(questionsList[questionNumber].name, content);
    questionNumber++;
    m.delete();
    if(questionNumber < questionsList.length) {
      questionEmbed.setTitle(questionsList[questionNumber].name);
      questionEmbed.setDescription(questionsList[questionNumber].question);
      await msg.edit({ embeds: [questionEmbed], components: client.config.general.cancel_ask == true ? [cancelAsk] : [] });
    } else if(questionNumber == questionsList.length) {
      questionEmbed.setTitle(client.language.titles.answers);
      questionEmbed.setDescription(client.language.ticket.loading_answers);
      await msg.edit({ embeds: [questionEmbed], components: client.config.general.cancel_ask == true ? [cancelAsk] : [] });

      let ansList = [];
      let answersArray = [...answersList.values()];
      let qAnswers = new Discord.MessageEmbed()
        .setTitle(client.language.titles.answers)
        .setColor(client.embeds.general_color)
        .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      for(let i = 0; i < answersArray.length; i++) {
        qAnswers.addField(questionsList[i].name, answersArray[i]);
        ansList.push({
          question: questionsList[i].name,
          answer: answersArray[i]
        });
      }

      db.set(`channelQuestions_${channel.id}`, ansList);
      await msg.edit({ embeds: [qAnswers], components: [] });
    }
  });

  collector.on('end', async (collected, reason) => {
    if(reason.toLowerCase() == "idle") {
      let idleEmbed = new Discord.MessageEmbed()
        .setDescription(client.language.ticket.question_idle)
        .setColor(client.embeds.general_color);
        
      channel.send({ embeds: [idleEmbed] });
    }
  });
}

const uploadImage = (url) => {
  return fetch(`https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5&source=${url}`, {
      method: "POST", 
  }).then((res) => res.json());
}

module.exports = {
  generalCategory,
  categoryCollector,
}
