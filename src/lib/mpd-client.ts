// @ts-nocheck
const mpd = require('mpd');
const cmd = mpd.cmd;
const debug = require('debug')('player:mpd-client');

enum MPDStatus {
  disconnected = 1,
  connecting = 2,
  reconnecting = 3,
  ready = 4,
}
class MDPClient {
  status = MPDStatus.disconnected;
  host = '';
  port = 0;
  constructor(host, port) {
    this.host = host;
    this.port = port;
    debug('constructor', host, port);
    this.connect();
  }
  retryConnect() {
    if (this.status === MPDStatus.reconnecting) return;
    this.status = MPDStatus.reconnecting;
    setTimeout(() => {
      this.connect();
    }, 3000);
  }
  connect() {
    const client = mpd.connect({
      port: this.port,
      host: this.host,
    });
    this.status = MPDStatus.connecting;
    client.on('ready', () => {
      debug('MPD client ready and connected to ' + this.host + ':' + this.port);
      this.status = MPDStatus.ready;
    });
    client.on('end', () => {
      debug('Connection ended');
      this.retryConnect();
    });

    client.on('error', (err) => {
      console.error('MPD client socket error: ' + err);
      this.retryConnect();
    });
    this.client = client;
  }
  onSystemChange(callback) {
    this.client.on('system', (name) => {
      callback(name);
    });
  }
  play(id, callback) {
    const arg = id ? [id] : [];
    this._sendCommands(cmd('playid', arg), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null, msg);
    });
  }
  pause(callback) {
    this._sendCommands(cmd('pause', [1]), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null, msg);
    });
  }
  repeat(on: boolean = false, callback) {
    this._sendCommands(cmd('repeat', [on ? 1 : 0]), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  next(callback) {
    this._sendCommands(cmd('next', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  previous(callback) {
    this._sendCommands(cmd('previous', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  getStatus(callback) {
    this._sendCommands([cmd('currentsong', []), cmd('status', [])], (err, msg) => {
      debug('_sendStatusRequest', err, msg);
      if (err) {
        return callback(err);
      }

      const data = mpd.parseKeyValueMessage(msg);
      const {
        id,
        Id,
        duration,
        Duration,
        volume,
        Volume,
        elapsed,
        Elapsed,
        random,
        Random,
        repeat,
        Repeat,
        state,
        State,
        songid,
        Songid,
        file,
        File,
      } = data;
      debug('rawData', data);
      const songInfo = {
        id: id || Id,
        duration: duration || Duration,
        volume: volume || Volume,
        title: file || File,
        elapsed: elapsed || Elapsed,
        random: random || Random,
        repeat: repeat || Repeat,
        state: state || State,
        songId: songid || Songid,
      };
      callback(null, songInfo);
    });
  }
  getElapsed(callback) {
    this._sendCommands(cmd('status', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const data = mpd.parseKeyValueMessage(msg);
      let elapsed = 0;
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase() === 'elapsed') {
          elapsed = value;
          break;
        }
      }
      callback(null, elapsed);
    });
  }
  getVolumn(callback) {
    this._sendCommands(cmd('getvol', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null, msg);
    });
  }
  getQueue(callback) {
    this._sendCommands(cmd('playlistinfo', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const list = this._transformList(msg);
      callback(null, list);
    });
  }
  clearQueue(callback) {
    this._sendCommands(cmd('clear', []), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  deleteSong(id) {
    this._sendCommands(cmd('deleteid', [id]), (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  getLibary(callback) {
    this._sendCommands(cmd('lsinfo', []), (err, msg) => {
      if (err) {
        return callback(err);
      }
      const list = this._transformList(msg);
      callback(null, list);
    });
  }
  setRandom(on: boolean, callback) {
    this._sendCommands(cmd('random', [on ? 1 : 0]), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null, msg);
    });
  }
  setVolumn(value: number, callback) {
    this._sendCommands(cmd('setvol', [value]), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null, msg);
    });
  }
  _sendCommands(commands, callback) {
    try {
      if (this.status !== MPDStatus.ready) callback('Not connected');

      const cb = (err, msg) => {
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
  _transformList(data) {
    const rawList = mpd.parseArrayMessage(data);
    debug('_transformList -> rawList', rawList);
    const list = rawList
      .map((item) => {
        const { id, Id, duration, Duration, file, File } = item;
        return {
          id: id || Id,
          duration: duration || Duration,
          title: file || File,
        };
      })
      .filter((item) => item.title);
    return list;
  }
}

export default MDPClient;
