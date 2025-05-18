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
    io.on('connection', (socket) => {
      this.socket = socket;
      debug('scoketServer -> connection');
      socket.on(MessageType.MESSAGE_EVENT, (type, data) => this.recieveMessage(type, data));
    });
    mpd.onSystemChange((name) => {
      debug('MPDSystem update received: ' + name);
      if (name === 'player' || name === 'mixer') {
        this.mpd.getStatus((err, status) => {
          if (err) {
            return;
          }
          this.sendMessage(MessageType.STATUS, status);
        });
      }
      if (name === 'playlist') {
        this.mpd.getQueue((err, list) => {
          if (err) {
            return;
          }
          this.sendMessage(MessageType.QUEUE, list);
        });
      }
      if (name === 'update') {
        this.mpd.getLibary((err, list) => {
          if (err) {
            return;
          }
          this.sendMessage(MessageType.LIBARY, list);
        });
      }
    });
    this.io = io;
    this.mpd = mpd;
  }

  broadcastMessage(type, rawData) {
    const data = objectToLowerCase(rawData);
    debug('Broadcast: ' + type + ' with %o', data);
    this.io.emit(MessageType.MESSAGE_EVENT, this.serializeMessage(type, data));
  }
  sendError(err) {
    this.sendMessage(MessageType.MPD_ERROR, err.message);
  }
  serializeMessage(type, data) {
    return JSON.stringify({
      type: type,
      payload: data ? data : null,
    });
  }
  sendMessage(type, data) {
    if (!this.socket) {
      debug('this.socket is null');
      return;
    }
    this.socket.emit(MessageType.MESSAGE_EVENT, this.serializeMessage(type, data));
  }
  recieveMessage(msg) {
    const { type, payload: data } = JSON.parse(msg);
    debug('Received %s with %o', type, data);
    switch (type) {
      case MessageType.PLAY:
        this.mpd.play(data, (err) => {
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
      case MessageType.SET_VOL:
        this.mpd.setVolumn(data, (err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.SINGLE:
        this.mpd.single((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.RANDOM:
        this.mpd.random((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.REPEAT:
        this.mpd.repeat((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.DELETE:
        this.mpd.delete(data, (err) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.OPERATION_SUCCESS);
        });
        break;
      case MessageType.PREVIOUS:
        this.mpd.previous((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
        });
        break;
      case MessageType.NEXT:
        this.mpd.next((err) => {
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
      case MessageType.REQUEST_QUEUE:
        this.mpd.getQueue((err, list) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.QUEUE, list);
        });
        break;
      case MessageType.REQUEST_CLEAR_QUEUE:
        this.mpd.clearQueue((err) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.OPERATION_SUCCESS);
        });
        break;
      case MessageType.REQUEST_ELAPSED:
        this.mpd.getElapsed((err, elapsed) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.ELAPSED, elapsed);
        });
        break;
      case MessageType.REQUEST_LIBARY:
        this.mpd.getLibary((err, list) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.LIBARY, list);
        });
        break;
      case MessageType.ADD_TO_QUEUE:
        this.mpd.addToQueue(data, (err) => {
          if (err) {
            this.sendError(err);
            return;
          }
          this.sendMessage(MessageType.OPERATION_SUCCESS);
        });
        break;
      case MessageType.MPD_HEART:
        this.sendMessage(MessageType.MPD_OFFLINE, this.mpd.status);
        break;
    }
  }
}

export default SocketIO;
