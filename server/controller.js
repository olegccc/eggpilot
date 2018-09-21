export default class Controller {

    constructor(session) {
        session.send({
          // TODO: send initial status
        });
        this._session = session;
    }

    onMessage(message, flags) {
        message = JSON.parse(message);
        console.log('got message: ', message);
        Object.keys(message).forEach(messageId => {
            const value = message[messageId] || {};
            switch (messageId) {
                // TODO: add handlers
              default:
                  break;
            }
        });
    }

    sendStatusMessage(message) {
        this._session.send({
            message
        });
    }

    onConnectionClosed() {
    }
}
