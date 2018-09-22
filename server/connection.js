export default class Controller {

  constructor(session, database) {
    this._database = database;
    this._session = session;
  }

  onMessage(message, flags) {
    message = JSON.parse(message);
    console.log('got message: ', message);
    Object.keys(message).forEach(messageId => {
      try {
        const value = message[messageId] || {};
        switch (messageId) {
          case 'deviceId':
            this.onDeviceId(value);
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
      this._deviceId = deviceId;
    } catch (err) {
      this.sendData({
        deviceError: err.message || 'Device is not recognized'
      });
    }
  }

  sendData(data) {
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
