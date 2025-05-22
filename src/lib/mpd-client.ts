const mpd = require('mpd');
const cmd = mpd.cmd;
const debug = require('debug')('player:mpd-client');

import formatTime from './format-time';
import { MPDStatus } from './constant';
import { isEmpty } from 'lodash';

type CallbackFn = (err?: Error | string | null | unknown, msg?: any) => void;

class MDPClient {
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
  }
  onSystemChange(callback: CallbackFn) {
    this.client.on('system', (name: string) => {
      callback(name);
    });
  }
  // done -> non result
  play(id: string | null, callback: CallbackFn) {
    const arg = id ? [id] : [];
    this._sendCommands(cmd('playid', arg), (err) => {
      debug('play', arg, err);
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  pause(callback: CallbackFn) {
    this._sendCommands(cmd('pause', [1]), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  next(callback: CallbackFn) {
    this._sendCommands(cmd('next', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  previous(callback: CallbackFn) {
    this._sendCommands(cmd('previous', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  setVolumn(value: number, callback: CallbackFn) {
    this._sendCommands([cmd('setvol', [value])], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  clearQueue(callback: CallbackFn) {
    this._sendCommands(cmd('clear', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  delete(id: string, callback: CallbackFn) {
    this._sendCommands(cmd('deleteid', [id]), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  addToQueue(id: string, callback: CallbackFn) {
    this._sendCommands(cmd('add', [id]), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  random(callback: CallbackFn) {
    this._sendCommands([cmd('single', [0]), cmd('repeat', [1]), cmd('random', [1])], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  single(callback: CallbackFn) {
    this._sendCommands([cmd('single', [1]), cmd('repeat', [1]), cmd('random', [0])], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done -> non result
  repeat(callback: CallbackFn) {
    this._sendCommands([cmd('single', [0]), cmd('repeat', [1]), cmd('random', [0])], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  // done
  getQueue(callback: CallbackFn) {
    this._sendCommands(cmd('playlistinfo', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const list: any[] = this._transformList(msg);
      callback(null, list);
    });
  }
  // done
  getElapsed(callback: CallbackFn) {
    this._sendCommands(cmd('status', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const data = mpd.parseKeyValueMessage(msg);
      let elapsed = '0';
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase() === 'elapsed') {
          elapsed = value as string;
          break;
        }
      }
      callback(null, elapsed);
    });
  }
  // done
  getStatus(callback: CallbackFn) {
    // , cmd('status', [])
    this._sendCommands([cmd('currentsong', []), cmd('status', [])], (err, msg) => {
      if (err) {
        return callback(err);
      }
      const data = this._transformStatus(msg);
      callback(null, data);
    });
  }
  // done
  getLibrary(callback: CallbackFn) {
    this._sendCommands(cmd('listall', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const list = this._transformList(msg);
      callback(null, list);
    });
  }
  // done
  _sendCommands(commands: any, callback: CallbackFn) {
    try {
      // debug('_sendCommands', commands);
      if (this.status !== MPDStatus.READY) callback('Not connected');
      const cb = (err: Error | null, msg: string) => {
        // debug('_sendCommands -> result', commands, err, msg);
        if (err) {
          debug(err);
          callback(err);
        } else {
          callback(null, msg);
        }
      };

      if (Array.isArray(commands)) this.client.sendCommands(commands, cb);
      else this.client.sendCommand(commands, cb);
    } catch (err) {
      callback(err);
    }
  }
  _transformList(msg: string) {
    return mpd
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
        const { id, duration, file } = item;
        return {
          id,
          file,
          duration,
          durationLabel: formatTime(duration),
        };
      });
  }
  _transformStatus(msg: string) {
    const keyValueObject = mpd.parseKeyValueMessage(msg);
    const formatedValue: any = {};
    for (const [key, value] of Object.entries(keyValueObject)) {
      formatedValue[key.toLowerCase()] = value;
    }
    const { id, duration, volume, elapsed, random, repeat, state, songid, file, single } = formatedValue;
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

export default MDPClient;
