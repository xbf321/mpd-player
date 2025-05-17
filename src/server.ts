import next from 'next';
import { createServer } from 'http';
import { loadEnvConfig } from '@next/env';

import MDPClient from './lib/mpd-client';
import SocketServer from './lib/socket-server';

loadEnvConfig(process.cwd());

const hostname = process.env.HOST_NAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '7180', 10);

const MPD_HOST = process.env.MPD_HOST;
const MPD_PORT = process.env.MPD_PORT;
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  new SocketServer(httpServer, new MDPClient(MPD_HOST, MPD_PORT));

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}, MPDServer -> ${MPD_HOST}:${MPD_PORT}`);
    });
});
