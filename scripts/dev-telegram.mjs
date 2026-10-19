import { spawn, spawnSync } from 'node:child_process';
import dns from 'node:dns';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(projectRoot, '.telegram-dev.json');

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(name);
const argValue = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
};

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = { ...loadEnvFile(path.join(projectRoot, '.env')), ...process.env };
const token = (env.TELEGRAM_BOT_TOKEN || env.BOT_TOKEN || '').trim();
const chatId = (env.TELEGRAM_CHAT_ID || '').trim();
const pinMessage = (env.TELEGRAM_PIN_MESSAGE ?? 'true').toLowerCase() !== 'false';
const provider = (argValue('--tunnel') || env.TUNNEL_PROVIDER || 'cloudflared').toLowerCase();
const forcedUrl = (argValue('--url') || env.TELEGRAM_WEBAPP_URL || '').trim();
const port = Number(argValue('--port') || env.DEV_PORT || 5173);
const startServer = !hasFlag('--no-server');
const skipTelegram = hasFlag('--no-telegram');
const dryRun = hasFlag('--dry-run');
const once = hasFlag('--once');
const skipReadyCheck = hasFlag('--skip-ready-check');
const readyTimeoutMs = Number(env.TUNNEL_READY_TIMEOUT_MS || 120_000);

function log(message) {
  process.stdout.write(`[rootwallet] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[rootwallet] Ошибка: ${message}\n`);
  process.exit(1);
}

function hasCommand(command) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [command], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

function resolveCommand(name) {
  if (name === 'cloudflared') {
    const candidates = [
      process.env.CLOUDFLARED_PATH,
      process.env['ProgramFiles(x86)'] &&
        path.join(process.env['ProgramFiles(x86)'], 'cloudflared', 'cloudflared.exe'),
      process.env.ProgramFiles &&
        path.join(process.env.ProgramFiles, 'cloudflared', 'cloudflared.exe'),
      process.env.LOCALAPPDATA &&
        path.join(process.env.LOCALAPPDATA, 'cloudflared', 'cloudflared.exe'),
      process.env.LOCALAPPDATA &&
        path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'cloudflared.exe'),
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return hasCommand(name) ? name : null;
}

async function fetchOk(url, timeoutMs = 4000) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchReachable(url, timeoutMs = 6000) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return true;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs, intervalMs, { anyResponse = false } = {}) {
  const startedAt = Date.now();
  let attempts = 0;
  while (Date.now() - startedAt < timeoutMs) {
    attempts += 1;
    if (anyResponse ? await fetchReachable(url) : await fetchOk(url)) return true;
    if (attempts % 10 === 0) {
      log(`Проверяю доступность (${Math.round((Date.now() - startedAt) / 1000)} с)`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

async function resolveHostIps(host) {
  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    const ips = (data.Answer || [])
      .filter((answer) => answer.type === 1)
      .map((answer) => answer.data);
    if (ips.length) return ips;
  } catch {
    // DoH недоступен, пробуем системный резолвер ниже
  }
  try {
    return await dns.promises.resolve4(host);
  } catch {
    return [];
  }
}

async function collectCloudflaredEdges() {
  const configured = (env.CLOUDFLARED_EDGE || '').trim();
  if (configured) {
    return configured
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  const edges = [];
  try {
    const response = await fetch(
      'https://cloudflare-dns.com/dns-query?name=_v2-origintunneld._tcp.argotunnel.com&type=SRV',
      { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(8000) },
    );
    const data = await response.json();
    const answers = (data.Answer || []).filter((answer) => answer.type === 33);
    for (const answer of answers.slice(0, 2)) {
      const parts = String(answer.data).split(/\s+/);
      const port = parts[2] || '7844';
      const target = parts[3] && parts[3].replace(/\.$/, '');
      if (!target) continue;
      const ips = await resolveHostIps(target);
      if (ips.length) edges.push(`${ips[0]}:${port}`);
    }
  } catch {
    // SRV недоступен, используем известные регионы ниже
  }
  if (!edges.length) {
    for (const host of ['region1.v2.argotunnel.com', 'region2.v2.argotunnel.com']) {
      const ips = await resolveHostIps(host);
      if (ips.length) edges.push(`${ips[0]}:7844`);
    }
  }
  return edges;
}

function detectBindAddress() {
  const configured = (env.CLOUDFLARED_BIND_ADDRESS || '').trim();
  if (configured) return configured;
  if ((env.CLOUDFLARED_NO_BIND || '').toLowerCase() === 'true') return null;
  const skipInterface =
    /vmware|virtualbox|hyper-v|vethernet|radmin|happ|bluetooth|loopback|tailscale|zerotier|wintun|vpn|tunnel/i;
  const candidates = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    if (skipInterface.test(name)) continue;
    for (const address of addresses || []) {
      if (address.family !== 'IPv4' || address.internal) continue;
      if (address.address.startsWith('169.254.')) continue;
      candidates.push(address.address);
    }
  }
  return candidates[0] || null;
}

function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill('SIGTERM');
}

let server = null;
let tunnel = null;
let publicUrl = forcedUrl;
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  stopProcess(tunnel);
  stopProcess(server);
}

process.on('SIGINT', () => {
  log('Остановка...');
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

if (hasFlag('--help')) {
  process.stdout.write(
    [
      'node scripts/dev-telegram.mjs [options]',
      '',
      'Options:',
      '  --tunnel <cloudflared|ngrok>  провайдер туннеля (default: cloudflared)',
      '  --url <https://...>           использовать готовый публичный URL',
      '  --port <number>               порт Vite dev server (default: 5173)',
      '  --no-server                   не запускать Vite, использовать уже запущенный',
      '  --no-telegram                 не обращаться к Bot API',
      '  --once                        обновить Telegram и выйти, не удерживать процесс',
      '  --skip-ready-check            не ждать доступности публичного URL',
      '  --dry-run                     показать конфигурацию и выйти',
      '',
      'Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_PIN_MESSAGE,',
      '     TUNNEL_PROVIDER, TELEGRAM_WEBAPP_URL, DEV_PORT, TUNNEL_READY_TIMEOUT_MS,',
      '     CLOUDFLARED_PATH, CLOUDFLARED_EDGE, CLOUDFLARED_BIND_ADDRESS, CLOUDFLARED_NO_BIND',
      '',
    ].join('\n'),
  );
  process.exit(0);
}

if (dryRun) {
  log(`Проект: ${projectRoot}`);
  log(`Туннель: ${publicUrl ? `готовый URL ${publicUrl}` : provider}`);
  log(`Порт: ${port}`);
  log(`Vite: ${startServer ? 'запускается скриптом' : 'внешний'}`);
  log(`Bot API: ${skipTelegram || !token ? 'выключен' : `включён, chat_id ${chatId || 'не задан'}`}`);
  log(`Режим: ${once ? 'обновить и выйти' : 'удерживать процесс'}`);
  process.exit(0);
}

if (!startServer && !publicUrl) {
  fail('С --no-server нужен готовый туннель: передайте --url или TELEGRAM_WEBAPP_URL');
}

if (startServer) {
  const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(viteBin)) fail('Не найден Vite. Сначала выполните npm.cmd install');

  log(`Запускаю Vite dev server на 127.0.0.1:${port}`);
  server = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: projectRoot, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true },
  );

  const ready = await waitForUrl(`http://127.0.0.1:${port}`, 45_000, 400);
  if (!ready) {
    shutdown();
    fail(`Vite не поднялся на порту ${port}. Проверьте, не занят ли порт.`);
  }
  log('Vite готов');
}

if (!publicUrl) {
  if (provider !== 'cloudflared' && provider !== 'ngrok') {
    fail(`Неизвестный провайдер туннеля: ${provider}. Используйте cloudflared или ngrok.`);
  }
  const tunnelCommand = resolveCommand(provider);
  if (!tunnelCommand) {
    const hint =
      provider === 'cloudflared'
        ? 'winget install --id Cloudflare.cloudflared -e'
        : 'winget install --id Ngrok.Ngrok -e';
    fail(`${provider} не найден. Установите: ${hint}`);
  }

  log(`Запускаю ${provider} туннель на http://127.0.0.1:${port}`);
  let args;
  if (provider === 'cloudflared') {
    args = ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`];
    const edges = await collectCloudflaredEdges();
    const bindAddress = detectBindAddress();
    for (const edge of edges) args.push('--edge', edge);
    if (bindAddress) args.push('--edge-bind-address', bindAddress);
    if (edges.length || bindAddress) {
      args.push('--protocol', 'http2', '--edge-ip-version', '4');
      log(
        `Cloudflare edge: ${edges.length ? edges.join(', ') : 'авто'}, bind ${
          bindAddress || 'авто'
        }, http2`,
      );
    }
  } else {
    args = ['http', String(port), '--log', 'stdout', '--log-format', 'json'];
  }
  tunnel = spawn(tunnelCommand, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const outputTail = [];
  let registrationLogged = false;
  const onChunk = (chunk) => {
    const text = chunk.toString();
    outputTail.push(text);
    if (outputTail.length > 40) outputTail.shift();
    if (!registrationLogged && /Registered tunnel connection/i.test(text)) {
      registrationLogged = true;
      log('Соединение с edge установлено');
    }
    const match = text.match(
      /https:\/\/[a-z0-9-]+\.(?:trycloudflare\.com|ngrok-free\.(?:app|dev)|ngrok\.app|ngrok\.io)/i,
    );
    if (match && !publicUrl) {
      publicUrl = match[0];
      log(`Публичный URL: ${publicUrl}`);
    }
  };
  tunnel.stdout.on('data', onChunk);
  tunnel.stderr.on('data', onChunk);

  tunnel.on('exit', (code) => {
    if (shuttingDown) return;
    const output = outputTail.join('');
    if (output) process.stderr.write(output);
    if (code !== 0 && /no such host|edge discovery|TLS handshake/i.test(output)) {
      log(
        'Подсказка: DNS или VPN мешает выходу к edge Cloudflare. Проверьте CLOUDFLARED_EDGE и CLOUDFLARED_BIND_ADDRESS в .env',
      );
    }
    shutdown();
    fail(
      `Туннель завершился с кодом ${code}` +
        (publicUrl ? `, URL ${publicUrl} больше не работает` : ''),
    );
  });

  const startedAt = Date.now();
  while (!publicUrl && Date.now() - startedAt < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!publicUrl) {
    shutdown();
    fail('Не удалось получить публичный URL за 60 секунд');
  }

  if (skipReadyCheck) {
    log('Проверка доступности пропущена (--skip-ready-check)');
  } else {
    log('Жду готовности туннеля');
    const tunnelReady = await waitForUrl(publicUrl, readyTimeoutMs, 1000, { anyResponse: true });
    if (!tunnelReady) {
      shutdown();
      fail(
        'Публичный URL не отвечает. Проверьте туннель и Vite или запустите с --skip-ready-check.',
      );
    }
    log('Туннель отвечает');
  }
}

async function telegram(method, payload) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
        signal: AbortSignal.timeout(20_000),
      });
      const data = await response.json().catch(() => null);
      if (!data || !data.ok) {
        throw new Error(`${method}: ${data?.description ?? `HTTP ${response.status}`}`);
      }
      return data.result;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        log(`Bot API ${method} не ответил (${error.message}), повтор ${attempt + 1}/3`);
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  }
  throw lastError;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(nextState) {
  fs.writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
}

async function updatePinnedButton(nextUrl) {
  const keyboard = {
    inline_keyboard: [[{ text: 'Открыть RootWallet', web_app: { url: nextUrl } }]],
  };
  const text = `RootWallet dev-стенд обновлён\n${nextUrl}`;
  const state = readState();

  if (state.chatId === chatId && state.messageId) {
    try {
      await telegram('editMessageText', {
        chat_id: chatId,
        message_id: state.messageId,
        text,
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });
      log('Кнопка в закреплённом сообщении обновлена');
      writeState({ ...state, url: nextUrl, updatedAt: Date.now() });
      return;
    } catch (error) {
      log(`Не удалось обновить сообщение (${error.message}), отправляю новое`);
    }
  }

  const message = await telegram('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: keyboard,
  });
  writeState({ chatId, messageId: message.message_id, url: nextUrl, updatedAt: Date.now() });
  log('Отправлено сообщение с кнопкой');

  if (!pinMessage) return;
  try {
    await telegram('pinChatMessage', {
      chat_id: chatId,
      message_id: message.message_id,
      disable_notification: true,
    });
    log('Сообщение закреплено');
  } catch (error) {
    log(`Не удалось закрепить сообщение: ${error.message}`);
  }
}

async function updateTelegram() {
  if (skipTelegram) {
    log('Bot API выключен флагом --no-telegram');
    return;
  }
  if (!token) {
    log('TELEGRAM_BOT_TOKEN не задан — кнопки не обновлены. Добавьте токен в .env');
    return;
  }

  await telegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'RootWallet',
      web_app: { url: publicUrl },
    },
  });
  log('Меню-кнопка Telegram обновлена');

  try {
    const me = await telegram('getMe');
    log(`Бот: https://t.me/${me.username}`);
  } catch (error) {
    log(`Не удалось получить данные бота: ${error.message}`);
  }

  if (!chatId) {
    log('TELEGRAM_CHAT_ID не задан — кнопка в чате не обновляется');
    return;
  }
  try {
    await updatePinnedButton(publicUrl);
  } catch (error) {
    log(`Не удалось обновить кнопку в чате: ${error.message}`);
  }
}

log(`Mini App URL: ${publicUrl}`);
try {
  await updateTelegram();
} catch (error) {
  log(`Не удалось обновить Telegram: ${error.message}`);
  if (once) {
    shutdown();
    process.exit(1);
  }
}
if (once) {
  log('Обновление кнопок завершено');
  shutdown();
  process.exit(0);
}
log('Готово. Остановите процесс через Ctrl+C.');

setInterval(() => {}, 1 << 30);
