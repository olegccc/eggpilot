import Controller from './controller'
import _ from 'lodash'

export default class Server {

    constructor() {
        this._sessionId = 1;
        this._sessions = {};
    }

    use(req, res, next) {
        console.log('use');
        res.end('test');
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

            session.controller = new Controller(session);

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
