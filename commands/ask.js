import chalk from 'chalk';

export default class Ask {
    constructor(api, client, db) {
        this.properties = {
                name: 'ask',
                description: 'Ask Anything!',
                dm_permission: false,
                options: [
                  {
                    name: "question",
                    description: "Your question",
                    type: 3,
                    required: true
                  }
                ]
              }
              this.client = client
              this.db = db
              this.api = api
    }
    async execute(interaction) {

        const question = interaction.options.getString("question");

        console.log("----------Channel Message--------");
        console.log("Date & Time : " + new Date());
        console.log("UserId      : " + interaction.user.id);
        console.log("User        : " + interaction.user.tag);
        console.log("Question    : " + question);
    
        try {
          await interaction.reply({ content: `Let Me Think 🤔` });
          this.askQuestion(question, interaction, async (content) => {
            if (!content.text) {
              if (content.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
                await interaction.editReply(`**${interaction.user.tag}:** ${question}\n**${this.client.user.username}:** API Error ❌\nCheck DM For Error Log ❗\n</>`);
                this.splitAndSendResponse(content, interaction.user);
              } else {
                await interaction.editReply(`**${interaction.user.tag}:** ${question}\n**${this.client.user.username}:** API Error ❌\n\`\`\`\n${content}\n\`\`\`\n</>`);
              }
              return;
            }
    
            console.log("Response    : " + content.text);
            console.log("---------------End---------------");
    
            if (content.text.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
              await interaction.editReply({ content: "The Answer Is Too Powerful 🤯,\nCheck Your DM 😅" });
              this.splitAndSendResponse(content.text, interaction.user);
            } else {
              await interaction.editReply(`**${interaction.user.tag}:** ${question}\n**${this.client.user.username}:** ${content.text}\n</>`);
            }

            const timeStamp = new Date();
            const date = timeStamp.getUTCDate().toString() + '.' + timeStamp.getUTCMonth().toString() + '.' + timeStamp.getUTCFullYear().toString();
            const time = timeStamp.getUTCHours().toString() + ':' + timeStamp.getUTCMinutes().toString() + ':' + timeStamp.getUTCSeconds().toString();
            await this.db.collection('chat-history').doc(interaction.user.id)
              .collection(date).doc(time).set({
                timeStamp: new Date(),
                userID: interaction.user.id,
                user: interaction.user.tag,
                question: question,
                answer: content.text,
                parentMessageId: content.id
              });
          })
        } catch (e) {
          console.error(chalk.red(e));
        }
    }
    async splitAndSendResponse(resp, user) {
        while (resp.length > 0) {
          let end = Math.min(process.env.DISCORD_MAX_RESPONSE_LENGTH, resp.length)
          await user.send(resp.slice(0, end))
          resp = resp.slice(end, resp.length)
        }
    }
    async askQuestion(question, interaction, cb) {
        const doc = await this.db.collection('users').doc(interaction.user.id).get();
        const currentDate = new Date().toISOString();
        const finalSystemMessage = process.env.SYSTEM_MESSAGE + ` Your Knowledge cutoff is 2021-09-01 and Current Date is ${currentDate}.`
    
        if (!doc.exists) {
          this.api.sendMessage(question, {
            systemMessage: finalSystemMessage
          }).then((response) => {
            this.db.collection('users').doc(interaction.user.id).set({
              timeStamp: new Date(),
              userId: interaction.user.id,
              user: interaction.user.tag,
              parentMessageId: response.id
            });
            cb(response);
          }).catch((err) => {
            cb(err);
            console.log(chalk.red("AskQuestion Error:" + err));
          })
        } else {
          this.api.sendMessage(question, {
            parentMessageId: doc.data().parentMessageId,
            systemMessage: finalSystemMessage
          }).then((response) => {
            this.db.collection('users').doc(interaction.user.id).set({
              timeStamp: new Date(),
              userId: interaction.user.id,
              user: interaction.user.tag,
              parentMessageId: response.id
            });
            cb(response);
          }).catch((err) => {
            cb(err);
            console.log(chalk.red("AskQuestion Error:" + err));
          });
        }
      }
};