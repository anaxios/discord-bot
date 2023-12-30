export default class ResetChat {
    constructor() {
        this.properties = {
                name: 'reset-chat',
                description: 'Start A Fresh Chat Session'
              }
    }
    execute() {
        console.log('reset chat');
    }

    // async execute() {
    //     const sent = await interaction.reply({ content: 'Pinging...🌐', fetchReply: true });
    //     await interaction.editReply(`Websocket Heartbeat: ${interaction.client.ws.ping} ms. \nRoundtrip Latency: ${sent.createdTimestamp - interaction.createdTimestamp} ms\n</>`);
    //     client.user.setActivity(activity);    
    // }
};