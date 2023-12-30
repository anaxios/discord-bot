export default class Ask {
    constructor() {
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
    }
    execute() {
        console.log('answer');
    }

    // async execute() {
    //     const sent = await interaction.reply({ content: 'Pinging...🌐', fetchReply: true });
    //     await interaction.editReply(`Websocket Heartbeat: ${interaction.client.ws.ping} ms. \nRoundtrip Latency: ${sent.createdTimestamp - interaction.createdTimestamp} ms\n</>`);
    //     client.user.setActivity(activity);    
    // }
};