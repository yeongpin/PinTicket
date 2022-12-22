const Discord = require("discord.js");
const db = require("quick.db");

module.exports = async(client, channel, guild) => {
  const config = client.config;
  const lang = client.language;
  if(config.general.ask_review == false) return;
  const ticketOwner = db.fetch(`ticketOwner_${channel.id}`);
  const claimedBy = db.fetch(`ticketClaimed_${channel.id}`) || db.fetch(`autoClaim_${channel.id}`) || null;
  const user = client.users.cache.get(ticketOwner);
  if(!user || claimedBy == null) return;
  let dataReview = {
    user,
    comment: "",
    stars: 0
  }

  setTimeout(async() => {
    await user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.comment, client.embeds.general_color)] }).catch((err) => {
      return console.error("User's DM Closed");
    });
  }, 2500);
  let commentFilter = (m) => m.channel.type == "DM" && m.author.id == user.id;

  const dm = await user.createDM();
  let commentCollector = await dm.createMessageCollector({ filter: commentFilter, time: 300000 });
  let rateMsg;
  commentCollector.on("collect", async(m) => {
    if(m.content.toLowerCase().includes("cancel")) {
      user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.cancel, client.embeds.success_color)] });
      commentCollector.stop("canceled");
      return;
    }
    if(dataReview.comment == "") {
      dataReview.comment = m.content;
      commentCollector.stop("collected");

      const buttons = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('one_star')
            .setEmoji("1️⃣")
            .setStyle('PRIMARY'),
        ).addComponents(
          new Discord.MessageButton()
            .setCustomId('two_star')
            .setEmoji("2️⃣")
            .setStyle('PRIMARY'),
        ).addComponents(
          new Discord.MessageButton()
            .setCustomId('three_star')
            .setEmoji("3️⃣")
            .setStyle('PRIMARY'),
        ).addComponents(
          new Discord.MessageButton()
            .setCustomId('four_star')
            .setEmoji("4️⃣")
            .setStyle('PRIMARY'),
        ).addComponents(
          new Discord.MessageButton()
            .setCustomId('five_star')
            .setEmoji("5️⃣")
            .setStyle('PRIMARY'),
        );
      const cancelBttn = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton()
          .setCustomId('cancel_star')
          .setEmoji("❌")
          .setStyle('DANGER')
        );

      rateMsg = await user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.star, client.embeds.general_color)], components: [buttons, cancelBttn] });
      let buttonFilter = (i) => i.user.id == user.id && 
        (
          i.customId == "one_star" || i.customId == "two_star" || i.customId == "three_star" ||
          i.customId == "four_star" || i.customId == "five_star" || i.customId == "cancel_star"
        );
      let starCollector = await dm.createMessageComponentCollector({ filter: buttonFilter, componentType: "BUTTON", time: 300000, max: 1 });
      starCollector.on("collect", async(b) => {
        await b.deferUpdate()
        if(b.customId == "one_star") dataReview.stars = 1;
        else if(b.customId == "two_star") dataReview.stars = 2;
        else if(b.customId == "three_star") dataReview.stars = 3;
        else if(b.customId == "four_star") dataReview.stars = 4;
        else if(b.customId == "five_star") dataReview.stars = 5;
        else if(b.customId == "cancel_star") {
          user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.cancel, client.embeds.success_color)] });
          starCollector.stop("canceled");
          return;
        }

        await user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.sent, client.embeds.success_color)] });

        let rId = client.utils.generateId();

        let rObject = {
          id: rId, 
          author: user.id,
          user: claimedBy,
          rating: dataReview.stars, 
          comment: dataReview.comment, 
          date: new Date()
        }
        
        client.utils.pushReview(channel, claimedBy, rObject);

        let announceEmbed = new Discord.MessageEmbed()
          .setColor(client.embeds.service.review.color);
        
        if(client.embeds.service.review.title) announceEmbed.setTitle(client.embeds.service.review.title);
        
        if(client.embeds.service.review.description) announceEmbed.setDescription(client.embeds.service.review.description.replace("<author>", user)
            .replace("<user>", `<@!${claimedBy}>`)
            .replace("<review>", dataReview.stars)
            .replace("<date>", new Date().toLocaleString())
            .replace("<comment>", dataReview.comment));
        
        let field = client.embeds.service.review.fields;
        for(let i = 0; i < client.embeds.service.review.fields.length; i++) {
          announceEmbed.addField(field[i].title, field[i].description.replace("<author>", user)
            .replace("<user>", `<@!${claimedBy}>`)
            .replace("<date>", new Date().toLocaleString())
            .replace("<review>", dataReview.stars)
            .replace("<comment>", dataReview.comment), false)
        }

        if(client.embeds.service.review.footer == true) announceEmbed.setFooter({ text: user.username, iconURL: user.displayAvatarURL() }).setTimestamp();
        if(client.embeds.service.review.thumbnail == true) announceEmbed.setThumbnail(user.displayAvatarURL());

        let reviewCh = client.utils.findChannel(guild, client.config.channels.reviews);
        reviewCh.send({ embeds: [announceEmbed] });

        starCollector.stop("collected");
      });

      starCollector.on("end", async(collected, reason) => {
        buttons.components[0].setStyle("SECONDARY").setDisabled(true);
        buttons.components[1].setStyle("SECONDARY").setDisabled(true);
        buttons.components[2].setStyle("SECONDARY").setDisabled(true);
        buttons.components[3].setStyle("SECONDARY").setDisabled(true);
        buttons.components[4].setStyle("SECONDARY").setDisabled(true);
        cancelBttn.components[0].setStyle("SECONDARY").setDisabled(true);

        rateMsg.edit({ components: [buttons, cancelBttn] });
        if(reason == "time" || reason == "idle") await user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.time, client.embeds.success_color)] });
      });
    }
  });

  commentCollector.on("end", async(collected, reason) => {
    if(reason != "collected" && reason != "canceled") {
      await user.send({ embeds: [client.embedBuilder(client, user, client.embeds.title, client.language.service.reviews.time, client.embeds.success_color)] }).catch((err) => console.log("User's DM Closed"));
    }
  });
}
