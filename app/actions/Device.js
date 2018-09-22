export default class Device {
  static MEASURES = 'MEASURES';
  static DEVICE_ID = 'DEVICE_ID';
  static DEVICE_ERROR = 'DEVICE_ERROR';
  static RECORDS = 'RECORDS';
  static STARTED = 'STARTED';

  static updateMeasures({humidity, temperature}) {
    return {
      type: Device.MEASURES,
      humidity,
      temperature
    };
  }

  static updateStarted(started) {
    return {
      type: Device.STARTED,
      started
    };
  }

  static setRecords(records) {
    return {
      type: Device.RECORDS,
      records
    };
  }

  static setDeviceId(deviceId) {
    return {
      type: Device.DEVICE_ID,
      deviceId
    };
  }

  static deviceError(message) {
    return {
      type: Device.DEVICE_ERROR,
      message
    };
  }
}
