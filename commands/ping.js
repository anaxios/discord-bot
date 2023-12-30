export default class Ping {
    constructor() {
        this.properties = {
                name: 'ping',
                description: 'Check Websocket Heartbeat && Roundtrip Latency'
              }
    }
    execute() {
        console.log('pong');
    }

    // async execute() {
    //     const sent = await interaction.reply({ content: 'Pinging...🌐', fetchReply: true });
    //     await interaction.editReply(`Websocket Heartbeat: ${interaction.client.ws.ping} ms. \nRoundtrip Latency: ${sent.createdTimestamp - interaction.createdTimestamp} ms\n</>`);
    //     client.user.setActivity(activity);    
    // }
};