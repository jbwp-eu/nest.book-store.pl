import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve } from 'path';
import { io, type Socket } from 'socket.io-client';

type ChatMessage = {
  id: string;
  orderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; isAdmin: boolean };
  clientMessageId?: string | null;
};

function loadEnvFile(): void {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const contents = readFileSync(envPath, 'utf8');
    for (const line of contents.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env optional for explicit CLI flags
  }
}

function printUsage(): void {
  console.log(`
Usage:
  npm run chat:test -- [options]

Options:
  --token <jwt>       JWT from POST /api/users/login (required)
  --order <uuid>      Order id (required)
  --base-url <url>    Server origin without /api (default: http://localhost:PORT)
  --message <text>    Send one message and stay connected
  --send-only         With --message: send and exit after chat:message
  --skip-history      Skip GET /api/orders/:id/chat-messages
`);
}

function parseArgs(argv: string[]) {
  const options: {
    token?: string;
    orderId?: string;
    baseUrl?: string;
    message?: string;
    sendOnly: boolean;
    skipHistory: boolean;
  } = {
    sendOnly: false,
    skipHistory: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--token':
        options.token = argv[++i];
        break;
      case '--order':
        options.orderId = argv[++i];
        break;
      case '--base-url':
        options.baseUrl = argv[++i];
        break;
      case '--message':
        options.message = argv[++i];
        break;
      case '--send-only':
        options.sendOnly = true;
        break;
      case '--skip-history':
        options.skipHistory = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

function resolveBaseUrl(explicit?: string): string {
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const fromEnv = process.env.CHAT_TEST_BASE_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const port = process.env.PORT ?? '3004';
  return `http://localhost:${port}`;
}

async function loadHistory(
  apiBase: string,
  orderId: string,
  token: string,
): Promise<void> {
  const url = `${apiBase}/orders/${orderId}/chat-messages`;
  console.log(`\nGET ${url}`);

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });

  const body = await response.json();
  if (!response.ok) {
    console.error('History failed:', body);
    process.exit(1);
  }

  const messages = body as ChatMessage[];
  console.log(`History (${messages.length} messages):`);
  if (messages.length === 0) {
    console.log('  (empty)');
    return;
  }

  for (const message of messages) {
    const who = message.sender.isAdmin
      ? `${message.sender.name} (admin)`
      : message.sender.name;
    console.log(
      `  [${new Date(message.createdAt).toLocaleString()}] ${who}: ${message.content}`,
    );
  }
}

function connectSocket(baseUrl: string, token: string): Socket {
  return io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
}

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Socket connection timeout (5s)'));
    }, 5000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      resolvePromise();
    });

    socket.once('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function sendMessage(socket: Socket, orderId: string, content: string): void {
  socket.emit('chat:send', {
    orderId,
    content,
    clientMessageId: crypto.randomUUID(),
  });
}

async function runInteractive(socket: Socket, orderId: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nInteractive mode. Type a message and press Enter. Commands: /quit');

  const prompt = () => {
    rl.question('> ', (line) => {
      const text = line.trim();
      if (text === '/quit' || text === '/exit') {
        rl.close();
        socket.disconnect();
        process.exit(0);
      }
      if (text) {
        sendMessage(socket, orderId, text);
      }
      prompt();
    });
  };

  prompt();
}

async function main(): Promise<void> {
  loadEnvFile();
  const options = parseArgs(process.argv.slice(2));

  if (!options.token || !options.orderId) {
    printUsage();
    process.exit(1);
  }

  const baseUrl = resolveBaseUrl(options.baseUrl);
  const apiBase = `${baseUrl}/api`;

  console.log(`Socket URL: ${baseUrl}`);
  console.log(`Order:      ${options.orderId}`);

  if (!options.skipHistory) {
    await loadHistory(apiBase, options.orderId, options.token);
  }

  const socket = connectSocket(baseUrl, options.token);

  socket.on('chat:message', (message: ChatMessage) => {
    const who = message.sender.isAdmin
      ? `${message.sender.name} (admin)`
      : message.sender.name;
    console.log(
      `\n[live] [${new Date(message.createdAt).toLocaleString()}] ${who}: ${message.content}`,
    );

    if (options.sendOnly && options.message) {
      socket.disconnect();
      process.exit(0);
    }
  });

  socket.on('chat:error', (payload: { message?: string }) => {
    console.error('\n[chat:error]', payload?.message ?? payload);
  });

  socket.on('disconnect', (reason) => {
    console.log(`\nDisconnected: ${reason}`);
  });

  try {
    await waitForConnect(socket);
    console.log(`\nConnected (id: ${socket.id})`);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }

  socket.emit('chat:join', { orderId: options.orderId });
  console.log(`Joined room order:${options.orderId}`);

  if (options.message) {
    sendMessage(socket, options.orderId, options.message);
    if (options.sendOnly) {
      setTimeout(() => {
        console.error('No chat:message received within 5s');
        socket.disconnect();
        process.exit(1);
      }, 5000);
      return;
    }
  }

  if (!options.message || !options.sendOnly) {
    await runInteractive(socket, options.orderId);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
