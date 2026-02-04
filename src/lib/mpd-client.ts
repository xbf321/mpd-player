import mpd from 'mpd';
import rawDebug from 'debug';
import { isEmpty, isPlainObject } from 'lodash';
import { promisify } from 'node:util';

import formatTime from './format-time';
import { MPDStatus, MessageType } from './constant';

const loop = () => {};
const debug = rawDebug('mpd-client');

type CallbackFn = (err?: Error | string | null | unknown, msg?: any) => void;

const EXEC_CMD_MAP: any = {
  [`${MessageType.REQUEST_PLAY}`]: (id: string) => {
    const arg = id ? [id] : [];
    return mpd.cmd('playid', arg);
  },
  [`${MessageType.REQUEST_PAUSE}`]: () => {
    return mpd.cmd('pause', [1]);
  },
  [`${MessageType.REQUEST_SINGLE}`]: () => {
    return [mpd.cmd('single', [1]), mpd.cmd('repeat', [1]), mpd.cmd('random', [0])];
  },
  [`${MessageType.REQUEST_RANDOM}`]: () => {
    return [mpd.cmd('single', [0]), mpd.cmd('repeat', [1]), mpd.cmd('random', [1])];
  },
  [`${MessageType.REQUEST_REPEAT}`]: () => {
    return [mpd.cmd('single', [0]), mpd.cmd('repeat', [1]), mpd.cmd('random', [0])];
  },
  [`${MessageType.REQUEST_DELETE}`]: (id: string) => {
    return mpd.cmd('deleteid', [id]);
  },
  [`${MessageType.REQUEST_PREVIOUS}`]: () => {
    return mpd.cmd('previous', []);
  },
  [`${MessageType.REQUEST_NEXT}`]: () => {
    return mpd.cmd('next', []);
  },
  [`${MessageType.REQUEST_STATUS}`]: () => {
    return {
      command: [mpd.cmd('currentsong', []), mpd.cmd('status', [])],
      processFn: MPDClient.__transformSongInfo,
    };
  },
  [`${MessageType.REQUEST_QUEUE}`]: () => {
    return {
      command: mpd.cmd('playlistinfo', []),
      processFn: MPDClient.__transformList,
    };
  },
  [`${MessageType.REQUEST_LIBRARY}`]: () => {
    return {
      command: mpd.cmd('listall', []),
      processFn: MPDClient.__transformList,
    };
  },
  [`${MessageType.REQUEST_CLEAR_QUEUE}`]: () => {
    return mpd.cmd('clear', []);
  },
  [`${MessageType.REQUEST_ADD_TO_QUEUE}`]: (id: string) => {
    return mpd.cmd('add', [id]);
  },
  [`${MessageType.REQUEST_SET_VOL}`]: (value: number) => {
    return mpd.cmd('setvol', [value]);
  }
};

class MPDClient {
  status = MPDStatus.DISCONNECTED;
  host = '';
  port = 0;
  client: any = null;
  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    debug('constructor', host, port);
    this.connect();
  }

  retryConnect() {
    if (this.status === MPDStatus.RECONNECTION) return;
    this.status = MPDStatus.RECONNECTION;
    setTimeout(() => {
      this.connect();
    }, 3000);
  }

  connect() {
    const client = mpd.connect({
      port: this.port,
      host: this.host,
    });
    this.status = MPDStatus.CONNECTION;
    client.on('ready', () => {
      debug('MPD client ready and connected to ' + this.host + ':' + this.port);
      this.status = MPDStatus.READY;
    });
    client.on('end', () => {
      debug('Connection ended');
      this.retryConnect();
    });

    client.on('error', (err: Error) => {
      debug('MPD client socket error: ' + err);
      this.retryConnect();
    });
    this.client = client;
    this.client.promisifiedSendCommand = promisify(this.client.sendCommand);
    this.client.promisifiedSendCommands = promisify(this.client.sendCommands);
  }

  onSystemChange(callback: CallbackFn) {
    this.client.on('system', (name: string) => {
      callback(name);
    });
  }

  doAction(type: MessageType, payload: string | null = null) {
    if (!EXEC_CMD_MAP[type]) {
      throw new Error(`${type} is not configration in the EXEC_CMD_MAP.`);
    }
    let processFn = loop;
    let commands = EXEC_CMD_MAP[type](payload);
    if (isPlainObject(commands)) {
      processFn = commands.processFn;
      commands = commands.command;
    }
    debug('doAction %o %o', type, commands);
    return this.__sendCommands(commands, processFn);
  }

  async __sendCommands(commands: string[] | string, processFn: any = null) {
    const response: {
      error: unknown;
      data: string | null;
    } = {
      error: null,
      data: null,
    };
    if (this.status !== MPDStatus.READY) {
      response.error = new Error('MPD is not connected');
      return response;
    }

    try {
      if (Array.isArray(commands)) {
        response.data = await this.client.promisifiedSendCommands(commands);
      } else {
        response.data = await this.client.promisifiedSendCommand(commands);
      }
      
      if (processFn) {
        response.data = processFn(response.data as string);
      }
    } catch (err) {
      response.error = err;
      response.data = null;
    }
    return response;
  }

  static __transformList(msg: string) {
    // debug('__transformList -> raw message: %o', msg);
    const formatedValue = mpd
      .parseArrayMessage(msg)
      .map((item: any) => {
        if (isEmpty(item)) {
          return null;
        }
        const formatedValue: any = {};
        // 返回来的数据 Key 有时是 Time 有时是 time
        // 这里统一用小些
        Object.keys(item).map((key) => {
          formatedValue[key.toLowerCase()] = item[key];
        });
        return formatedValue;
      })
      .filter((item: any) => item !== null)
      .map((item: any) => {
        const { id = '', duration = '', file = '' } = item;
        return {
          id,
          file,
          duration,
          durationLabel: formatTime(duration),
        };
      });
    return formatedValue;
  }

  static __transformSongInfo(msg: string) {
    const keyValueObject = mpd.parseKeyValueMessage(msg);
    const formatedValue: any = {};
    for (const [key, value] of Object.entries(keyValueObject)) {
      formatedValue[key.toLowerCase()] = value;
    }
    
    const {
      id = '',
      duration = '',
      volume,
      elapsed = '',
      random,
      repeat,
      state,
      songid = '',
      file = '',
      single = '0',
    } = formatedValue;
    return {
      id,
      songid,
      file,
      duration,
      durationLabel: formatTime(duration),
      elapsed,
      elapsedLabel: formatTime(elapsed),
      volume,
      random,
      repeat,
      state,
      single,
    };
  }
}

export default MPDClient;
