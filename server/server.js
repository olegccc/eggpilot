import Controller from './connection'
import DeviceApi from './deviceApi'
import Database from './database'
import _ from 'lodash'

const urlExpression = /\/api\/([^/]+)(?:\/(.+))?/;

export default class Server {

  constructor(production) {
    this._sessionId = 1;
    this._sessions = {};
    this._post = {};
    this._get = {};
    this._database = new Database();
    this._production = production;
  }

  async initialize(mongodb) {
    await this._database.initialize(mongodb);
    this._deviceApi = new DeviceApi(this._post, this._get, this._database, this._production, props => this.onDeviceChanged(props));
  }

  onDeviceChanged({deviceId, temperature, humidity, time}) {
    console.log(`device changed: ${deviceId}, temperature ${temperature}, humidity ${humidity}`);
    for (const session of Object.values(this._sessions)) {
      if (session.deviceId !== deviceId) {
        continue;
      }
      try {
        console.log('sending update to session');
        session.send({
          newMeasure: {
            temperature,
            humidity,
            time
          }
        });
      } catch (err) {
      }
    }
  }

  async use(req, res, next) {

    const match = req.baseUrl.match(urlExpression);
    if (!match) {
      next();
      return;
    }
    const method = match[1];
    const rest = match[2];
    let table;
    if (req.method === 'POST') {
      table = this._post;
    } else if (req.method === 'GET') {
      table = this._get;
    } else {
      next();
      return;
    }
    const handler = table[method];
    if (!handler) {
      next();
      return;
    }

    try {
      const ret = await handler(req.body, rest, req, res);
      if (ret) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(ret));
      }
    } catch (err) {
      if (err.message) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          error: err.message
        }));
      }
    }
  }

  async onSocketConnection(ws) {
    try {
      const session = {
        location: ws.upgradeReq && ws.upgradeReq.url,
        socket: ws,
        id: this._sessionId++,
        send: async (message, options) => {
          return await this.sendMessageAsync(session, message, options);
        }
      };

      session.controller = new Controller(session, this._database);

      this._sessions[session.id] = session;

      ws.on('message', async (message, flags) => {
        session.controller.onMessage(message, flags);
      });

      const onSessionClose = () => {
        if (session.closed) {
          return;
        }
        session.closed = true;
        ws.removeAllListeners();
        this._sessions[session.id] = undefined;
        session.controller.onConnectionClosed();
      };

      session.close = () => {
        session.socket.close();
        onSessionClose();
      };

      ws.addListener('close', onSessionClose);
      ws.addListener('error', err => {
        console.log('Client error', err);
        onSessionClose();
      });
    } catch (err) {
      console.log('Session establish error', err);
    }
  }

  sendMessageAsync(session, message, options) {

    if (!options && !_.isString(message)) {
      message = JSON.stringify(message);
    }

    return new Promise((resolve, reject) => {
      session.socket.send(message, options, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      })
    });
  }

  onSocketError(err) {
    console.log('Socket error', err);
  }
}
