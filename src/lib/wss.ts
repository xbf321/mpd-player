// @ts-nocheck
const debug = require('debug')('player:wss');

function objectToLowerCase(data) {
  if (!data) {
    return data;
  } else if (Array.isArray(data)) {
    return data.map((value) => objectToLowerCase(value));
  } else if (typeof data === 'object') {
    var retData = {};
    for (const [key, value] of Object.entries(data)) {
      retData[key.toLowerCase()] = objectToLowerCase(value);
    }
    return retData;
  } else {
    return data;
  }
}

class WSS {
  constructor(wss, mpd) {
    wss.on('connection', function connection(ws) {
      ws.on('error', (err) => debug(err));
      ws.on('message', function message(data) {
        var msg = JSON.parse(data);
        debug('Received %s with %o', msg.type, msg.data);
        switch (msg.type) {
          case 'PLAY':
            mpd.play((err) => {
              if (err) {
                debug('PLAY', err);
                this.sendMessage(ws, 'MPD_OFFLINE');
              }
            });
            break;
        }
      });
    });
    mpd.onStatusChange((status) => {
      this.broadcastMessage('STATUS', status);
    });
    this.server = wss;
  }
  broadcastMessage(type, rawData) {
    const data = objectToLowerCase(rawData);
    debug('Broadcast: ' + type + ' with %o', data);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, type, data, false);
      }
    });
  }
  sendMessage(client, type, rawData, showDebug = true) {
    const data = objectToLowerCase(rawData);
    showDebug && debug('Send: ' + type + ' with %o', data);
    const msg = {
      type: type,
      data: data ? data : {},
    };
    client.send(JSON.stringify(msg), (error) => {
      if (error) debug('Failed to send data to client %o', error);
    });
  }
}

export default WSS;
