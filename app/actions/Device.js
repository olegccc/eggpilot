export default class Device {
  static MEASURES = 'MEASURES';
  static DEVICE_ID = 'DEVICE_ID';
  static DEVICE_ERROR = 'DEVICE_ERROR';
  static RECORDS = 'RECORDS';
  static NEW_MEASURE = 'NEW_MEASURE';
  static IMAGE = 'IMAGE';
  static TIME_STATS = 'TIME_STATS';
  static UPDATE_MEASURE_TIME = 'UPDATE_MEASURE_TIME';

  static updateMeasures({humidity, temperature}) {
    return {
      type: Device.MEASURES,
      humidity,
      temperature
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

  static newMeasure(measure) {
    return {
      type: Device.NEW_MEASURE,
      measure
    };
  }

  static timeStats(stats) {
    const time = new Date().getTime();
    for (const key of Object.keys(stats)) {
      const value = stats[key];
      if (value === null) {
        continue;
      }
      stats[key] = time - value;
    }
    return {
      type: Device.TIME_STATS,
      stats
    };
  }

  static image(image) {
    return {
      type: Device.IMAGE,
      image
    };
  }

  static updateMeasureTime() {
    return {
      type: Device.UPDATE_MEASURE_TIME
    };
  }
}
