export default class Ping {
    constructor(api, client, db) {
        this.properties = {
                name: 'ping',
                description: 'Check Websocket Heartbeat && Roundtrip Latency'
              }
              this.client = client
              this.db = db
              this.api = api
    }
    async execute(interaction) {
            const channel = await this.client.channels.fetch(interaction.channel.id);
            await channel.sendTyping();

            const sent = await interaction.reply({ content: 'Pinging...🌐', fetchReply: true });
            await interaction.editReply(`Websocket Heartbeat: ${interaction.client.ws.ping} ms. \nRoundtrip Latency: ${sent.createdTimestamp - interaction.createdTimestamp} ms\n</>`);

    }
};