import rawDebug from 'debug';
import { Server } from 'socket.io';
import { MessageType, PlayStatus } from './constant';

const debug = rawDebug('socket-server');

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

class SocketServer {
  private __mpd;
  private __io;
  private __socket;
  constructor(httpServer, mpd) {
    const io = new Server(httpServer, {
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      this.__socket = socket;
      debug('scoketServer -> connection');
      socket.on(MessageType.MESSAGE_EVENT, (msg: string) => this.recieveMessage(msg));

      socket.on('disconnect', () => {
        debug('scoketServer -> disconnect');
        this.sendMessage(MessageType.MPD_STATUS, this.__mpd.status);
      });
    });

    mpd.onSystemChange(async (name) => {
      debug('MPDSystem update received: %o', name);
      if (name === 'player' || name === 'mixer') {
        const { error, data } = await this.__mpd.doAction(MessageType.REQUEST_STATUS);
        if (error) {
          return;
        }
        this.sendMessage(MessageType.STATUS, data);
      }
      if (name === 'playlist') {
        const { error, data } = await this.__mpd.doAction(MessageType.REQUEST_QUEUE);
        if (error) {
          return;
        }
        this.sendMessage(MessageType.QUEUE, data);
      }
      if (name === 'update') {
        const { error, data } = await this.__mpd.doAction(MessageType.REQUEST_LIBRARY);
        if (error) {
          return;
        }
        this.sendMessage(MessageType.LIBRARY, data);
      }
    });

    this.__io = io;
    this.__mpd = mpd;
  }

  broadcastMessage(type, rawData) {
    const data = objectToLowerCase(rawData);
    debug('Broadcast: ' + type + ' with %o', data);
    this.__io.emit(MessageType.MESSAGE_EVENT, this.serializeMessage(type, data));
  }

  serializeMessage(type, data) {
    return JSON.stringify({
      type,
      payload: data ? data : null,
    });
  }

  sendMessage(type, data = null) {
    if (!this.__socket) {
      debug('this.__socket is null');
      return;
    }
    debug(`sendMessage, type:${type}, %o`, data);
    this.__socket.emit(MessageType.MESSAGE_EVENT, this.serializeMessage(type, data));
  }

  async recieveMessage(msg) {
    debug('Received %o', msg);
    const { type, payload } = JSON.parse(msg);

    if (type === MessageType.REQUEST_MPD_STATUS) {
      return this.sendMessage(MessageType.MPD_STATUS, this.__mpd.status);
    }

    const { error, data } = await this.__mpd.doAction(type, payload);
    if (error) {
      this.sendMessage(MessageType.MPD_ERROR, error.message);
      return;
    }
    switch (type) {
      case MessageType.REQUEST_DELETE:
        this.sendMessage(MessageType.OPERATION_SUCCESS);
        break;
      case MessageType.REQUEST_STATUS:
        this.sendMessage(MessageType.STATUS, data);
        break;
      case MessageType.REQUEST_QUEUE:
        this.sendMessage(MessageType.QUEUE, data);
        break;
      case MessageType.REQUEST_LIBRARY:
        this.sendMessage(MessageType.LIBRARY, data);
        break;
      case MessageType.REQUEST_ADD_TO_QUEUE:
        this.sendMessage(MessageType.OPERATION_SUCCESS);
        break;
    }
  }
}

export default SocketServer;
