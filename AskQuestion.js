export default class AskQuestion {
    constructor(api, client, db) {
        this.client = client
        this.db = db
        this.api = api
    }
    async ask(question, interaction, cb) {
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
}