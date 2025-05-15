import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer} from 'ws';

import WSS from './lib/wss';
import MDPClient from './lib/mpd-client';



const port = parseInt(process.env.PORT || '7180', 10);
const MPD_HOST = '10.147.20.1';
const MPD_PORT = 7160
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // @ts-ignore
  const wss = new WebSocketServer({ server });
  new WSS(wss, new MDPClient(MPD_HOST, MPD_PORT));
  server.listen(port);

  // console.log('mpd', mpd);
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`,
  );
});
