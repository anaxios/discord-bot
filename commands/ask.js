import chalk from 'chalk';
import AskQuestion from '../AskQuestion.js';

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
        console.log(interaction);
        const question = interaction.options.getString("question");

        console.log("----------Channel Message--------");
        console.log("Date & Time : " + new Date());
        console.log("UserId      : " + interaction.user.id);
        console.log("User        : " + interaction.user.tag);
        console.log("Question    : " + question);

        const askQuestion = new AskQuestion(this.api, this.client, this.db);
    
        try {
          await interaction.reply({ content: `Let Me Think 🤔` });
          askQuestion.ask(question, interaction, async (content) => {
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
    
};