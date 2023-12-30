export default class Help {
    constructor() {
        this.properties = {
                name: 'help',
                description: 'Get Help'
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