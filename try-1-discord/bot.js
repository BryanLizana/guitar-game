require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const pty = require('node-pty');
const fs = require('fs');
const { execSync } = require('child_process');

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const PERSONALITY_FILE = './personality.md';
const RESPONSE_TIMEOUT_MS = 60_000;

let CLAUDE_BIN;
try {
  CLAUDE_BIN = execSync('where claude', { encoding: 'utf-8' }).split('\n')[0].trim();
} catch {
  CLAUDE_BIN = 'claudexxx';
}
console.log(`[INIT] claude bin: ${CLAUDE_BIN}`);

function stripAnsi(str) {
  return str
    .replace(/\x1B\[[0-9;]*[mGKHFABCDJsu]/g, '')
    .replace(/\x1B\][^\x07]*\x07/g, '')
    .replace(/\x1B[@-_][0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '');
}

let claudeProc = null;
let outputBuffer = '';
let responseResolver = null;
let responseTimer = null;
let isProcessing = false;
const messageQueue = [];

function resolveResponse() {
  if (!responseResolver) return;
  clearTimeout(responseTimer);
  responseTimer = null;

  const buf = outputBuffer;
  outputBuffer = '';
  const res = responseResolver;
  responseResolver = null;

  if (buf.includes('<FIN>')) {
    const idx = buf.indexOf('<FIN>');
    res(buf.slice(0, idx).trim());
  } else {
    // FIN never arrived — return whatever we have
    console.warn('[WARN] <FIN> no detectado, devolviendo buffer completo');
    res(buf.trim());
  }
}

async function startClaude() {
  return new Promise((resolve) => {
    outputBuffer = '';
    claudeProc = pty.spawn(CLAUDE_BIN, [], {
      name: 'xterm-color',
      cols: 220,
      rows: 50,
      cwd: process.cwd(),
    });

    claudeProc.onData((data) => {
      process.stdout.write(data); // mirror PTY to console
      outputBuffer += stripAnsi(data);

      if (responseResolver && outputBuffer.includes('<FIN>')) {
        resolveResponse();
      }
    });

    claudeProc.onExit(async ({ exitCode }) => {
      console.log(`[CLAUDE] proceso terminó (code ${exitCode}), reiniciando...`);
      outputBuffer = '';
      await startClaude();
      await initPersonality();
    });

    setTimeout(resolve, 4000);
  });
}

function sendToClaude(prompt) {
  return new Promise((resolve) => {
    outputBuffer = '';
    claudeProc.write(prompt + '\r');

    // Skip echo window, then arm resolver
    setTimeout(() => {
      outputBuffer = '';
      responseResolver = resolve;

      // Fallback: if FIN never arrives, resolve with whatever is in buffer
      responseTimer = setTimeout(() => {
        console.warn(`[WARN] Timeout (${RESPONSE_TIMEOUT_MS / 1000}s), buf(${outputBuffer.length}):`, JSON.stringify(outputBuffer.slice(-200)));
        resolveResponse();
      }, RESPONSE_TIMEOUT_MS);
    }, 300);
  });
}

function loadPersonality() {
  try {
    return fs.readFileSync(PERSONALITY_FILE, 'utf-8').trim();
  } catch {
    return '';
  }
}

async function initPersonality() {
  const personality = loadPersonality();
  if (!personality) return;
  console.log('[INIT] Enviando personalidad...');
  await sendToClaude(personality);
  console.log('[INIT] Claude listo');
}

async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;
  isProcessing = true;
  const { prompt, resolve, reject } = messageQueue.shift();
  try {
    const response = await sendToClaude(prompt);
    resolve(response);
  } catch (err) {
    reject(err);
  } finally {
    isProcessing = false;
    processQueue();
  }
}

function askClaude(prompt) {
  return new Promise((resolve, reject) => {
    messageQueue.push({ prompt, resolve, reject });
    processQueue();
  });
}

async function sendChunked(channel, text) {
  const MAX = 1990;
  if (text.length <= MAX) {
    await channel.send(text);
    return;
  }
  const chunks = text.match(/.{1,1990}/gs) || [];
  for (const chunk of chunks) {
    await channel.send(chunk);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ]
});

client.once('ready', async () => {
  console.log(`Bot online: ${client.user.tag}`);
  console.log(`Escuchando canal: ${CHANNEL_ID}`);
  await startClaude();
  await initPersonality();
});

client.on('messageCreate', async (message) => {
  console.log(`[MSG] canal:${message.channelId} autor:${message.author.tag} contenido:"${message.content}"`);
  if (message.author.bot) return;
  if (message.channelId !== CHANNEL_ID) return;
  if (!message.mentions.has(client.user)) return;

  const prompt = message.content.replace(`<@${client.user.id}>`, '').trim();

  if (!prompt) {
    await message.reply('¿En qué te puedo ayudar? Mencióname seguido de tu pregunta.');
    return;
  }

  await message.react('🤔');

  try {
    const response = await askClaude(prompt);
    await message.reactions.cache.get('🤔')?.users.remove(client.user.id);
    await message.react('✅');
    await sendChunked(message.channel, `**${message.author.username}:** ${prompt}\n\n${response}`);
  } catch (err) {
    console.error('[ERROR]', err.message);
    await message.reactions.cache.get('🤔')?.users.remove(client.user.id);
    await message.react('❌');
    await message.reply(`Error: ${err.message}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
