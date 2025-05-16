// @ts-nocheck
import { Server } from 'socket.io';
import { MessageType } from './constant';
const debug = require('debug')('player:socket.io');
const objectToLowerCase = (data) => {
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
};
class SocketIO {
  mpd = null;
  socket = null;
  constructor(httpServer, mpd) {
    const io = new Server(httpServer);
    this.io = io;
    this.mpd = mpd;

    io.on('connection', (socket) => {
      this.socket = socket;
      debug('connection');
      socket.on(MessageType.MESSAGE_EVENT, (type, data) => this.onMessage(type, data));
      // ...
    });
    mpd.onStatusChange((status) => {
      this.broadcastMessage(MessageType.STATUS, status);
    });
  }

  broadcastMessage(type, rawData) {
    const data = objectToLowerCase(rawData);
    debug('Broadcast: ' + type + ' with %o', data);
    this.io.emit(MessageType.MESSAGE_EVENT, type, data);
  }
  sendError(err) {
    this.sendMessage(MessageType.MPD_OFFLINE, err);
  }
  sendMessage(type, data) {
    if (!this.socket) {
      debug('this.socket is null');
      return;
    }
    this.socket.emit(MessageType.MESSAGE_EVENT, type, data);
  }
  onMessage(type, data) {
    debug('Received %s with %o', type, data);
    switch (type) {
      /*
      case 'REPEAT':
        mpd.repeat(data, (err) => {
          if (err) {
            debug('PAUSE', err);
            this.sendMessage(ws, 'MPD_OFFLINE');
          }
        });
        break;
      case 'GET_VOL':
        mpd.getVolumn((err, status) => {
          if (err) {
            return this.sendMessage(ws, 'MPD_OFFLINE', null);
          }
          this.sendMessage(ws, 'STATUS', status);
        });
        break;
      case 'SET_VOL':
        mpd.setVolumn(data, (err, status) => {
          if (err) {
            return this.sendMessage(ws, 'MPD_OFFLINE', null);
          }
          this.sendMessage(ws, 'STATUS', status);
        });
        break;
      
      case 'REQUEST_ELAPSED':
        mpd.getElapsed((err, elapsed) => {
          if (err) {
            return this.sendMessage(ws, 'MPD_OFFLINE', null);
          }
          this.sendMessage(ws, 'ELAPSED', elapsed);
        });
        break;
      
      */
      case MessageType.RANDOM:
        this.mpd.setRandom(data, (err, msg) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.RANDOM);
        });
        break;
      case MessageType.PLAY:
        this.mpd.play((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.PAUSE:
        this.mpd.pause((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.REQUEST_STATUS:
        this.mpd.getStatus((err, status) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.STATUS, status);
        });
        break;
      case MessageType.QUEUE:
        this.mpd.getQueue((err, list) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.QUEUE, list);
        });
        break;
    }
  }
}

export default SocketIO;
