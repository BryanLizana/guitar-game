require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ]
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TIMEOUT_MS = 120_000;
const PERSONALITY_FILE = './personality.md';

function loadPersonality() {
  try {
    return fs.readFileSync(PERSONALITY_FILE, 'utf-8').trim();
  } catch {
    return '';
  }
}

function askClaude(userPrompt) {
  const personality = loadPersonality();
  const fullPrompt = personality
    ? `${personality}\n\n---\nUsuario: ${userPrompt}`
    : userPrompt;

  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['-p', '--output-format', 'json'], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout: Claude tardó demasiado en responder.'));
    }, TIMEOUT_MS);

    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { error += data.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(error.trim() || `Claude terminó con código ${code}`));
        return;
      }
      try {
        const json = JSON.parse(output.trim());
        const tokens_in  = json.total_input_tokens  ?? '?';
        const tokens_out = json.total_output_tokens ?? '?';
        const cost       = json.cost_usd != null ? `$${json.cost_usd.toFixed(5)}` : '?';
        console.log(`[TOKENS] entrada:${tokens_in} salida:${tokens_out} costo:${cost}`);
        resolve(json.result ?? output.trim());
      } catch {
        resolve(output.trim());
      }
    });

    proc.stdin.write(fullPrompt, 'utf-8');
    proc.stdin.end();
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

client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
  console.log(`Escuchando canal: ${CHANNEL_ID}`);
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
    await message.reactions.cache.get('🤔')?.users.remove(client.user.id);
    await message.react('❌');
    await message.reply(`Error: ${err.message}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
