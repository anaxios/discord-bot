export default class ResetChat {
    constructor(api, client, db) {
        this.properties = {
                name: 'reset-chat',
                description: 'Start A Fresh Chat Session'
              }
              this.client = client
              this.db = db
              this.api = api
    }
    async execute(interaction) {
        const timeStamp = new Date();
        const date = timeStamp.getUTCDate().toString() + '.' + timeStamp.getUTCMonth().toString() + '.' + timeStamp.getUTCFullYear().toString();
        const time = timeStamp.getUTCHours().toString() + ':' + timeStamp.getUTCMinutes().toString() + ':' + timeStamp.getUTCSeconds().toString();

        const channel = await this.client.channels.fetch(interaction.channel.id);
        await channel.sendTyping();

        await interaction.reply('Checking...📚');
        const doc = await this.db.collection('users').doc(interaction.user.id).get();
        if (!doc.exists) {
          console.log('Failed: No Conversation Found ❌');
          await interaction.editReply('No Conversation Found ❌\nUse `/ask` To Start One\n</>');
          await this.db.collection('reset-chat-log').doc(interaction.user.id)
            .collection(date).doc(time).set({
              timeStamp: new Date(),
              userID: interaction.user.id,
              user: interaction.user.tag,
              resetChatSuccess: 0
            });
        } else {
          await this.db.collection('users').doc(interaction.user.id).delete();
          console.log('Chat Reset: Successful ✅');
          await interaction.editReply('Chat Reset: Successful ✅\n</>');
          await this.db.collection('reset-chat-log').doc(interaction.user.id)
            .collection(date).doc(time).set({
              timeStamp: new Date(),
              userID: interaction.user.id,
              user: interaction.user.tag,
              resetChatSuccess: 1
            });
        }    
    }

};