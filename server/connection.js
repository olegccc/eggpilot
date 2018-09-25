export default class Controller {

  constructor(session, database) {
    this._database = database;
    this._session = session;
  }

  onMessage(messageText, flags) {
    const message = JSON.parse(messageText);
    if (!message.ping) {
      console.log(`socket got message: ${messageText}`);
    }
    Object.keys(message).forEach(messageId => {
      try {
        const value = message[messageId] || {};
        switch (messageId) {
          case 'deviceId':
            this.onDeviceId(value);
            break;
          case 'ping':
            this._session.send({
              pong: true
            });
            break;
          default:
            break;
        }
      } catch (err) {
      }
    });
  }

  async onDeviceId(deviceId) {
    try {
      const {temperature, humidity, records, started} = await this._database.getDeviceMeasures(deviceId);
      this.sendData({
        measures: {
          temperature,
          humidity
        },
        records,
        started
      });
      setTimeout(async () => {
        try {
          const { image } = await this._database.getDeviceImage(deviceId);
          if (!image) {
            return;
          }
          this._session.send(image, {
            binary: true
          });
        } catch (err) {
        }
      });
      this._session.deviceId = deviceId;
    } catch (err) {
      this.sendData({
        deviceError: err.message || 'Device is not recognized'
      });
    }
  }

  sendData(data) {
    console.log(`socket send message: ${JSON.stringify(data)}`);
    this._session.send(data);
  }

  sendStatusMessage(message) {
    this.sendData({
      message
    });
  }

  onConnectionClosed() {
  }
}
