// https://socket.io/how-to/use-with-nextjs
import next from 'next';
import { createServer } from 'http';
import { loadEnvConfig } from '@next/env';

import MDPClient from './lib/mpd-client';
import SocketServer from './lib/socket-server';
const dev = process.env.NODE_ENV !== 'production';
if (dev) {
  // DEV 环境使用 .env 调试
  loadEnvConfig(process.cwd());
}

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '7100', 10);
const MPD_HOST = process.env.MPD_HOST || '0.0.0.0';
const MPD_PORT = Number(process.env.MPD_PORT) || 6600;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const mpdClient = new MDPClient(MPD_HOST as string, MPD_PORT);
  new SocketServer(httpServer, mpdClient);
  // 追加不到 Nextjs 中的 Request 里
  // 迂回一下，放到 process 中，便于在 /api/ 中访问
  // @ts-ignore
  process.mpdClient = mpdClient;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}, MPDServer -> ${MPD_HOST}:${MPD_PORT}`);
    });
});
