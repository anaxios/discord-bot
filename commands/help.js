export default class Help {
    constructor(api, client, db) {
        this.properties = {
                name: 'help',
                description: 'Get Help'
              }
              this.client = client
              this.db = db
              this.api = api
    }
    async execute(client, db, interaction) {
        const channel = await this.client.channels.fetch(interaction.channel.id);
        await channel.sendTyping();
        await interaction.reply("**ChatGPT Discord Bot**\nA Discord Bot Powered By OpenAI's ChatGPT !\n\n**Usage:**\nDM - Ask Anything\n`/ask` - Ask Anything\n`/reset-chat` - Start A Fresh Chat Session\n`/ping` - Check Websocket Heartbeat && Roundtrip Latency\n\nSource Code: <https://github.com/itskdhere/ChatGPT-Discord-BOT>\nSupport Server: https://dsc.gg/skdm");

    }
};