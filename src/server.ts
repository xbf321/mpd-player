// @ts-nocheck
import next from 'next';
import { createServer } from 'http';
import { loadEnvConfig } from '@next/env';

import MDPClient from './lib/mpd-client';
import SocketIOServer from './lib/socket-io';

// import WSS from './lib/wss';
// import { WebSocketServer } from 'ws';
// import { parse } from 'url';

loadEnvConfig(process.cwd());

const port = parseInt(process.env.PORT || '7180', 10);
const MPD_HOST = process.env.MPD_HOST;
const MPD_PORT = process.env.MPD_PORT;
const dev = process.env.NODE_ENV !== 'production';

const hostname = "localhost";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  // const httpServer = createServer((req, res) => {
  //   const parsedUrl = parse(req.url!, true);
  //   handle(req, res, parsedUrl);
  // });
  new SocketIOServer(httpServer, new MDPClient(MPD_HOST, MPD_PORT));

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}, MPDServer -> ${MPD_HOST}:${MPD_PORT}`);
    });

  // const wss = new WebSocketServer({ server });
  // new WSS(wss, new MDPClient(MPD_HOST, MPD_PORT));
  // server.listen(port);

  // console.log(
  //   `> Server listening at http://localhost:${port} as ${
  //     dev ? 'development' : process.env.NODE_ENV
  //   }`,
  // );
});
