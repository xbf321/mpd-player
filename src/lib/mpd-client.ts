// @ts-nocheck
const mpd = require('mpd');
const cmd = mpd.cmd;
const debug = require('debug')('player:mpd-client');
const parser = require('./parser');

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
  updateClients = [];
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
    client.on('system', (name) => {
      debug('System update received: ' + name);
      if (name === 'playlist' || name === 'player') {
        this._sendStatusRequest((error, status) => {
          if (!error) {
            debug('updateClients', this.updateClients, status)
            this.updateClients.forEach((callback) => {
              callback(status);
            });
          }
        });
      }
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
  play(callback) {
    this._sendPlay(true, callback);
  }
  pause(callback) {
    this._sendPlay(false, callback);
  }
  repeat(on: boolean = false, callback) {
    this._sendCommands(cmd('repeat', [on ? 1 : 0]), (err, msg) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }
  getStatus(callback) {
    this._sendStatusRequest(callback)
  }
  getElapsed(callback) {
    this._sendElapsedRequest(callback);
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
      let list = mpd.parseArrayMessage(msg);
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
  onStatusChange(callback) {
    this.updateClients.push(callback);
  }
  _sendPlay(play: boolean, callback) {
    debug('_sendPlay', play);
    const command = play ? 'play' : 'pause';
    const arg = play ? [] : [1];
    this._sendCommands(cmd(command, arg), (err, msg) => {
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
  _sendStatusRequest(callback) {
    this._sendCommands([cmd('currentsong', []), cmd('status', [])], (err, msg) => {
      debug('_sendStatusRequest', err, msg);
      if (err) {
        return callback(err);
      }
      const status = mpd.parseKeyValueMessage(msg);
      callback(null, status);
    });
  }
  _sendElapsedRequest(callback) {
    this._sendCommands(cmd("status", []),
      (err, msg) => {
        if (err) {
          return callback(err);
        }
        const data = mpd.parseKeyValueMessage(msg);
        var elapsed = { elapsed: 0 };
        for (const [key, value] of Object.entries(data)) {
          if (key.toLowerCase() === 'elapsed') {
            elapsed.elapsed = value;
            break;
          }
        }
        callback(null, elapsed);
      });
  }
}

export default MDPClient;
