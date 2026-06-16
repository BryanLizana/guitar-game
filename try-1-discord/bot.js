require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { execFile, execSync } = require('child_process');
const fs = require('fs');

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const PERSONALITY_FILE = './personality.md';
const MODEL = process.env.CLAUDE_MODEL || 'haiku';
const TIMEOUT_MS = 120_000;
// El historial crece con cada turno; reiniciar la sesión lo mantiene acotado.
const MAX_TURNS_PER_SESSION = 20;

let CLAUDE_BIN;
try {
  CLAUDE_BIN = execSync('where claude', { encoding: 'utf-8' }).split('\n')[0].trim();
} catch {
  console.error('[ERROR] claude no encontrado en PATH. Instalar desde https://claude.ai/download');
  process.exit(1);
}
console.log(`[INIT] claude bin: ${CLAUDE_BIN}`);
console.log(`[INIT] modelo: ${MODEL}`);

function loadPersonality() {
  try {
    return fs.readFileSync(PERSONALITY_FILE, 'utf-8').trim();
  } catch {
    return 'Eres un asistente en un servidor de Discord. Responde en español, breve y directo.';
  }
}

let sessionId = null;
let turnCount = 0;

function resetSession() {
  sessionId = null;
  turnCount = 0;
}

function callClaude(prompt) {
  const args = [
    '-p', prompt,
    '--system-prompt', loadPersonality(),
    '--tools', '',
    '--disable-slash-commands',
    '--strict-mcp-config',
    '--model', MODEL,
    '--output-format', 'json',
  ];
  if (sessionId) args.push('--resume', sessionId);

  return new Promise((resolve, reject) => {
    execFile(CLAUDE_BIN, args, { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return reject(new Error((stderr || err.message).trim()));
      }
      let data;
      try {
        data = JSON.parse(stdout);
      } catch {
        return reject(new Error(`Respuesta no parseable: ${String(stdout).slice(0, 200)}`));
      }
      if (data.is_error || data.subtype !== 'success') {
        resetSession();
        return reject(new Error(data.result || `Claude devolvió un error (${data.subtype})`));
      }
      sessionId = data.session_id;
      turnCount++;
      if (turnCount >= MAX_TURNS_PER_SESSION) {
        console.log(`[SESION] ${MAX_TURNS_PER_SESSION} turnos alcanzados, se reinicia la memoria`);
        resetSession();
      }
      const u = data.usage || {};
      console.log(`[CLAUDE] turno ${turnCount || MAX_TURNS_PER_SESSION} | in:${u.input_tokens} cache:${u.cache_read_input_tokens} out:${u.output_tokens} | $${(data.total_cost_usd ?? 0).toFixed(4)}`);
      resolve(data.result);
    });
  });
}

async function callClaudeWithRetry(prompt) {
  const hadSession = sessionId !== null;
  try {
    return await callClaude(prompt);
  } catch (err) {
    // Si falló reanudando una sesión (expirada/corrupta), reintentar desde cero
    if (hadSession) {
      console.warn(`[WARN] fallo con --resume (${err.message}), reintentando sesión nueva`);
      resetSession();
      return await callClaude(prompt);
    }
    throw err;
  }
}

// Cola para serializar: --resume sobre la misma sesión no admite llamadas concurrentes
let isProcessing = false;
const messageQueue = [];

async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;
  isProcessing = true;
  const { prompt, resolve, reject } = messageQueue.shift();
  try {
    resolve(await callClaudeWithRetry(prompt));
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

client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
  console.log(`Escuchando canal: ${CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== CHANNEL_ID) return;
  if (!message.mentions.has(client.user)) return;
  console.log(`[MSG] autor:${message.author.tag} contenido:"${message.content}"`);

  const prompt = message.content.replace(`<@${client.user.id}>`, '').trim();

  if (!prompt) {
    await message.reply('¿En qué te puedo ayudar? Mencióname seguido de tu pregunta.');
    return;
  }

  if (prompt.toLowerCase() === 'reset') {
    resetSession();
    await message.reply('🧹 Memoria reiniciada. Empezamos de cero.');
    return;
  }

  await message.react('🤔');

  try {
    const response = await askClaude(`${message.author.username}: ${prompt}`);
    await message.reactions.cache.get('🤔')?.users.remove(client.user.id);
    await message.react('✅');
    await sendChunked(message.channel, response);
    if (turnCount > 0 && turnCount % 10 === 0) {
      await message.channel.send(
        `💡 Llevamos **${turnCount}** mensajes en memoria. Escribe \`@Claudio reset\` para limpiarla y ahorrar tokens (se limpia sola a los ${MAX_TURNS_PER_SESSION}).`
      );
    }
  } catch (err) {
    console.error('[ERROR]', err.message);
    await message.reactions.cache.get('🤔')?.users.remove(client.user.id);
    await message.react('❌');
    await message.reply(`Error: ${err.message.slice(0, 300)}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
