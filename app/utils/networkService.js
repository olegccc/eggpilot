import Notifications from '../actions/Notifications'
import _ from 'lodash'

class NetworkService {

    constructor() {
        this._reconnecting = false;
        this._imageBuffers = [];
    }

    initialize(dispatch) {
        if (this._dispatch) {
            return;
        }
        this._dispatch = dispatch;
        this.setStatus('connecting');
        this.connect();
    }

    setStatus(status) {
        // console.log(`connection status: ${status}`);
        this._dispatch(Notifications.connectionStatus(status));
    }

    connect() {
        this.closeSocket();
        const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
        const url = protocol + location.hostname + ':' + location.port;
        this._socket = new WebSocket(url);
        this._socket.onerror = () => this._onSocketError();
        this._socket.onmessage = event => this._onSocketMessage(event);
        this._socket.onopen = () => this._onSocketOpen();
        this._socket.onclose = () => this._onSocketClose();
    }

    reconnect(delay = 500) {
        if (this._reconnecting) {
            return;
        }
        this.setStatus('reconnecting');
        this._reconnecting = true;
        setTimeout(() => {
            this._reconnecting = false;
            try {
                this.connect();
            } catch (error) {
                this.setStatus('error');
                // console.log('connection error: ', error);
                this.reconnect();
            }
        }, 500);
    }

    closeSocket() {
        if (!this._socket) {
            return;
        }
        this._socket.onerror = null;
        this._socket.onclose = null;
        this._socket.onmessage = null;
        this._socket.onopen = null;
        this._socket = null;
    }

    _onSocketError() {
        this.closeSocket();
        this.setStatus('error');
        this.reconnect();
    }

    _onBinaryData(data) {
        const array = new Uint8Array(data);
        if (array.byteLength === 0) {
            return;
        }
        console.log('received image part', data);
        const mode = array[0];
        if (mode === 1) {
            this._imageBuffers = [];
        }
        this._imageBuffers.push(array.subarray(1));
        if (mode !== 3) {
            return;
        }
        let totalLength = this._imageBuffers.reduce((p, c) => p + c.byteLength, 0);
        const imageArray = new Uint8Array(totalLength);
        let offset = 0;
        this._imageBuffers.forEach(b => {
            imageArray.set(b, offset);
            offset += b.byteLength;
        });
        this._imageBuffers = [];
        this._dispatch(Notifications.image(imageArray));
    }

    _onTextData(command, data) {
        switch (command) {
            // TODO: handle commands
            default:
                break;
        }
    }

    _onSocketMessage(event) {

        if (!event || !event.data) {
            return;
        }

        if (_.isString(event.data)) {
            _.each(JSON.parse(event.data), (value, key) => {
                this._onTextData(key, value);
            });
        } else if (this._socket.binaryType === 'blob') {
            const fileReader = new FileReader();
            const service = this;
            fileReader.onload = function() {
                service._onBinaryData(this.result);
            };
            fileReader.readAsArrayBuffer(event.data);
        }
    }

    _onSocketOpen() {
        this.setStatus('connected');
    }

    _onSocketClose() {
        this.closeSocket();
        this.reconnect();
    }

    sendCommand(command) {

        if (!this._socket) {
            return;
        }

        if (_.isString(command)) {
            command = {
                [command]: true
            };
        }

        this._socket.send(JSON.stringify(command));
    }
}

const instance = new NetworkService();

export default instance;
