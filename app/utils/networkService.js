import Notifications from '../actions/Notifications'
import Device from '../actions/Device'
import _ from 'lodash'

class NetworkService {

  constructor() {
    this._reconnecting = false;
    this._imageBuffers = [];
    this._connected = false;
    this._deviceId = undefined;
  }

  initialize(dispatch) {
    if (this._dispatch) {
      return;
    }
    this._dispatch = dispatch;

    // This is in order to not to display initially 'connecting' status if connection is less than 3 seconds
    this.setStatus('');
    setTimeout(() => {
      if (!this._status) {
        this.setStatus('connecting');
      }
    }, 3000);

    this.connect();
  }

  setStatus(status) {
    this._status = status;
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
    this._connected = false;
    if (!this._socket) {
      return;
    }
    this._socket.onerror = null;
    this._socket.onclose = null;
    this._socket.onmessage = null;
    this._socket.onopen = null;
    this._socket = null;
    this._deleteReceiveTimer();
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
    console.log('received image', data);
    const blob = new Blob([ array ], {
      type: 'image/jpeg'
    });
    this._dispatch(Device.image(URL.createObjectURL(blob)));
    this._dispatch(Device.timeStats({
      imageTime: 0
    }));
  }

  _onTextData(command, data) {
    switch (command) {
      case 'deviceError':
        this._dispatch(Device.deviceError(data));
        break;
      case 'measures':
        this._dispatch(Device.updateMeasures(data));
        break;
      case 'records':
        this._dispatch(Device.setRecords(data));
        break;
      case 'newMeasure':
        this._dispatch(Device.newMeasure(data));
        this._dispatch(Device.timeStats({
          measureTime: 0
        }));
        break;
      case 'timeStats':
        this._dispatch(Device.timeStats(data));
        break;
      default:
        break;
    }
  }

  _onSocketMessage(event) {

    if (!event || !event.data) {
      return;
    }

    this._lastMessage = new Date().getTime();

    if (_.isString(event.data)) {
      const parsed = JSON.parse(event.data);
      _.each(parsed, (value, key) => {
        this._onTextData(key, value);
      });
    } else if (this._socket.binaryType === 'blob') {
      const fileReader = new FileReader();
      const service = this;
      fileReader.onload = function () {
        service._onBinaryData(this.result);
      };
      fileReader.readAsArrayBuffer(event.data);
    }
  }

  _onSocketOpen() {
    this.setStatus('connected');
    this._connected = true;
    if (this._deviceId) {
      this.sendCommand({
        deviceId: this._deviceId
      });
    }
    this._lastMessage = new Date().getTime();
    this._createReceiveTimer();
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

  setDevice(deviceId) {
    this._deviceId = deviceId;
    if (!this._connected) {
      return;
    }
    this.sendCommand({
      deviceId
    });
  }

  _createReceiveTimer() {
    this._resetReceiveTimer();
  }

  _deleteReceiveTimer() {
    if (this._receiveTimeout) {
      clearTimeout(this._receiveTimeout);
      this._receiveTimeout = undefined;
    }
  }

  _onReceiveTimer() {
    this._receiveTimeout = undefined;
    if (new Date().getTime() - this._lastMessage > 15000) {
      this.closeSocket();
      this.setStatus('reconnecting');
      this.connect();
      return;
    }
    this.sendCommand('ping');
    this._resetReceiveTimer();
  }

  _resetReceiveTimer() {
    this._deleteReceiveTimer();
    this._receiveTimeout = setTimeout(() => this._onReceiveTimer(), 5000);
  }
}

const instance = new NetworkService();

export default instance;
