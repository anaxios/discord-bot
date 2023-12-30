// Imports
import chalk from 'chalk';
import dotenv from 'dotenv'; dotenv.config();
import { ChatGPTAPI } from 'chatgpt';
import Keyv from 'keyv';
import http from 'http';
import axios from 'axios';
import figlet from 'figlet';
import gradient from 'gradient-string';
import admin from 'firebase-admin';
import KeyvFirestore from 'keyv-firestore';
import {
  Client, REST, Partials,
  GatewayIntentBits, Routes,
  ActivityType, ChannelType
}
  from 'discord.js';

// Import Firebase Admin SDK Service Account Private Key
import firebaseServiceAccount from './firebaseServiceAccountKey.json' assert {type: 'json'};
import fs from 'fs';
import path from 'path';
import AskQuestion from './AskQuestion.js';

// Defines
const activity = '/ask && /help';


// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel]
});

// Initialize OpenAI Session
async function initOpenAI(messageStore) {
  if (process.env.API_ENDPOINT.toLocaleLowerCase() === 'default') {
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      apiBaseUrl: process.env.OPENAI_BASE_URL,
      completionParams: {
        model: process.env.MODEL,
	      temperature: parseFloat(process.env.TEMPERATURE),
      },
      messageStore,
      debug: process.env.DEBUG
    });
    return api;
  } else {
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      apiBaseUrl: process.env.API_ENDPOINT.toLocaleLowerCase(),
      completionParams: {
        model: process.env.MODEL,
      },
      messageStore,
      debug: process.env.DEBUG
    });
    return api;
  }
}

async function loadCommands() {
  const commands = new Array();
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const { default: Command } = await import(path.resolve('./commands', file));
    const command = new Command(api, client, db);
    commands.push(command.properties);
  }
  return commands;
}


// Initialize Discord Application Commands & New ChatGPT Thread
async function initDiscordCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('Started refreshing application commands (/)');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: await loadCommands() }).then(() => {
      console.log('Successfully reloaded application commands (/)');
    }).catch(e => console.log(chalk.red(e)));
    console.log('Connecting to Discord Gateway...');
  } catch (error) {
    console.log(chalk.red(error));
  }
}

// Initialize Firebase Admin SDK
async function initFirebaseAdmin() {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
    databaseURL: `https://${firebaseServiceAccount.project_id}.firebaseio.com`
  });
  const db = admin.firestore();
  return db;
}

// Initialize Keyv Firestore
async function initKeyvFirestore() {
  const messageStore = new Keyv({
    store: new KeyvFirestore({
      projectId: firebaseServiceAccount.project_id,
      collection: 'messageStore',
      credentials: firebaseServiceAccount
    })
  });
  return messageStore;
}

// Main Function
async function main() {
  if (process.env.UWU === 'true') {
    console.log(gradient.pastel.multiline(figlet.textSync('ChatGPT', {
      font: 'Univers',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 100,
      whitespaceBreak: true
    })));
  }

  const db = await initFirebaseAdmin();

  const messageStore = await initKeyvFirestore();

  const api = await initOpenAI(messageStore).catch(error => {
    console.error(error);
    process.exit();
  });

  await initDiscordCommands().catch(e => { console.log(e) });

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(chalk.greenBright('Connected to Discord Gateway'));
    console.log(new Date())
    client.user.setStatus('online');
    client.user.setActivity(activity);
  });

  // Channel Message Handler
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    client.user.setActivity(interaction.user.tag, { type: ActivityType.Watching });

    const { default: Command } = await import(path.resolve('./commands', interaction.commandName + '.js'));
    const command = new Command(api, client, db);
    command.execute(interaction);

  });

  // Direct Message Handler
  client.on("messageCreate", async message => {
    if (process.env.DIRECT_MESSAGES !== "true" || message.channel.type != ChannelType.DM || message.author.bot) {
      return;
    }

    if (!process.env.DM_WHITELIST_ID.includes(message.author.id)) {
      await message.author.send("Ask Bot Owner To WhiteList Your ID 🙄");
      const timeStamp = new Date();
      const date = timeStamp.getUTCDate().toString() + '.' + timeStamp.getUTCMonth().toString() + '.' + timeStamp.getUTCFullYear().toString();
      const time = timeStamp.getUTCHours().toString() + ':' + timeStamp.getUTCMinutes().toString() + ':' + timeStamp.getUTCSeconds().toString();
      await db.collection('unauthorized-dm-log').doc(message.author.id)
        .collection(date).doc(time).set({
          timeStamp: new Date(),
          userId: message.author.id,
          user: message.author.tag,
          question: message.content,
          bot: message.author.bot
        });
      return;
    }

    console.log("----------Direct Message---------");
    console.log("Date & Time : " + new Date());
    console.log("UserId      : " + message.author.id);
    console.log("User        : " + message.author.tag);
    console.log("Question    : " + message.content);



    try {
      let sentMessage = await message.author.send("Let Me Think 🤔");

      let interaction = {
        "user": {
          "id": message.author.id,
          'tag': message.author.tag
        }
      }
      const askQuestion = new AskQuestion(api, client, db);
      askQuestion.ask(message.content, interaction, async (response) => {
        if (!response.text) {
          if (response.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
            splitAndSendResponse(response, message.author)
          } else {
            await sentMessage.edit(`API Error ❌\n\`\`\`\n${response}\n\`\`\`\n</>`)
          }
          return;
        }

        if (response.text.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
          splitAndSendResponse(response.text, message.author)
        } else {
          await sentMessage.edit(response.text)
        }
        console.log("Response    : " + response.text);
        console.log("---------------End---------------");
        const timeStamp = new Date();
        const date = timeStamp.getUTCDate().toString() + '.' + timeStamp.getUTCMonth().toString() + '.' + timeStamp.getUTCFullYear().toString();
        const time = timeStamp.getUTCHours().toString() + ':' + timeStamp.getUTCMinutes().toString() + ':' + timeStamp.getUTCSeconds().toString();
        await db.collection('dm-history').doc(message.author.id)
          .collection(date).doc(time).set({
            timeStamp: new Date(),
            userId: message.author.id,
            user: message.author.tag,
            question: message.content,
            answer: response.text,
            parentMessageId: response.id
          });
      })
    } catch (e) {
      console.error(e)
    }
  });

  
}

  client
    .login(process.env.DISCORD_BOT_TOKEN)
    .catch(e => console.log(chalk.red(e)));

  

// HTTP Server
if (process.env.HTTP_SERVER === 'true') {
  http.createServer((req, res) => res.end('BOT Is Up && Running..!!')).listen(process.env.PORT);
}

// Discord Rate Limit Check
setInterval(() => {
  client.user.setActivity(activity);

  axios
    .get('https://discord.com/api/v10')
    .catch(error => {
      if (error.response.status == 429) {
        console.log("Discord Rate Limited");
        console.warn("Status: " + error.response.status)
        console.warn(error)
        // TODO: Take Action (e.g. Change IP Address)
      }
    });

}, 30 * 1000); // Check Every 30 Second

main() // Call Main function
