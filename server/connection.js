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
          case 'statsOnly':
            this._session.statsOnly = true;
            break;
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
      const {temperature, humidity, records, started, stopped, measureTime, imageTime} = await this._database.getDeviceMeasures(deviceId);
      const time = new Date().getTime();
      for (const record of records) {
        record.time -= started;
      }
      this.sendData({
        measures: {
          temperature,
          humidity
        },
        records,
        timeStats: {
          measureTime: measureTime ? time - measureTime : null,
          imageTime : imageTime ? time - imageTime : null,
          started: started ? time - started : null,
          stopped: stopped ? time - stopped : null,
        }
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
