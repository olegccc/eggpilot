import axios from 'axios'
import {ALERT_NONE, ALERT_TIMEOUT, ALERT_TEMPERATURE} from './database';

const MAXIMUM_TEMPERATURE_ALERT = 400;
const MINIMUM_MEASURE_TIME = 30000;
const MINIMUM_UPDATE_TIME = 30000;

  export default class DeviceApi {
  constructor(postTable, getTable, database, production, onDeviceChanged) {
    if (!process.env.TOKEN_ID) {
      return;
    }
    this._database = database;
    this._onDeviceChanged = onDeviceChanged;
    postTable.addDevice = this.addDevice.bind(this);
    postTable.removeDevice = this.removeDevice.bind(this);
    postTable.updateDevice = this.updateDevice.bind(this);
    postTable.startMeasure = this.startMeasure.bind(this);
    postTable.stopMeasure = this.stopMeasure.bind(this);
    postTable.updateImage = this.updateImage.bind(this);
    postTable.deviceStatus = this.deviceStatus.bind(this);
    postTable.botUpdate = this.botUpdate.bind(this);

    postTable.testSubscribe = this.testSubscribe.bind(this);
    postTable.testUnsubscribe = this.testUnsubscribe.bind(this);
    postTable.testFindSubscriptions = this.testFindSubscriptions.bind(this);
    postTable.testGetSubscriptions = this.testGetSubscriptions.bind(this);
    postTable.testGetDevice = this.testGetDevice.bind(this);

    // if (!production) {
      postTable.createDevice = this.createDevice.bind(this);
    // }
  }

  async createDevice({tokenId}, rest, req) {

    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    const records = [
      [232, 570],
      [230, 570],
      [241, 552],
      [244, 550],
      [256, 515],
      [270, 510],
      [275, 511],
      [289, 525],
      [310, 530],
      [332, 535],
      [356, 599],
      [374, 620]
    ];

    let time = new Date().getTime();

    time -= records.length * 10000;

    const {deviceId} = await this._database.addDevice({
      time
    });

    await this._database.startMeasure({deviceId});

    for (const record of records) {
      const temperature = record[0];
      const humidity = record[1];
      console.log('time', time);
      await this._database.updateDevice({deviceId: deviceId.toString(), temperature, humidity, time});
      time += 10000;
    }

    return {
      url: `http://${req.headers.host}/#/device/${deviceId}`
    };
  }

  async addDevice(body) {
    const {tokenId} = body;
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error(`Unknown token id, got: ${JSON.stringify(body)}`);
    }

    const { deviceId } = await this._database.addDevice({});

    return {
      deviceId,
      deviceUrl: `#/device/${deviceId}`
    };
  }

  async removeDevice({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    await this._database.removeDevice({
      deviceId
    });

    setTimeout(() => this._onDeviceChanged({
      deviceId,
      started: null,
      stopped: null,
      imageTime: null,
      measureTime: null
    }));

    return {
      success: true
    };
  }

  async updateDevice({deviceId, temperature, humidity, tokenId}) {
    const time = new Date().getTime();
    const {
      started,
    } = await this._database.updateDevice({
      deviceId, temperature, humidity, time
    });
    setTimeout(() => this._onDeviceChanged({
      deviceId,
      newMeasure: {
        temperature,
        humidity,
      }
    }));
    return {
      started: new Date().getTime() - started
    };
  }

  async updateImage(data, rest, req, res) {
    const tokenId = req.headers['token-id'];
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    const array = new Uint8Array(data);
    console.log(array.byteLength);
    const deviceId = req.headers['device-id'];
    await this._database.updateImage({
      deviceId,
      image: data
    });
    setTimeout(() => this._onDeviceChanged({
      deviceId,
      image: data
    }));
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      success: true
    }));
  }

  async startMeasure({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    const time = new Date().getTime();

    await this._database.startMeasure({deviceId});

    setTimeout(() => this._onDeviceChanged({
      deviceId,
      temperature: null,
      humidity: null,
      measureTime: null,
      imageTime: null,
      stopped: null,
      started: 0
    }));

    return {
      success: true
    };
  }

  async stopMeasure({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    await this._database.stopMeasure({deviceId});

    setTimeout(() => this._onDeviceChanged({
      deviceId,
      temperature: null,
      humidity: null,
      measureTime: null,
      imageTime: null,
      stopped: 0
    }));

    return {
      success: true
    };
  }

  async deviceStatus({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    const { humidity, temperature, measureTime } =
      await this._database.getDeviceMeasures(deviceId);
    const time = new Date().getTime();

    return {
      temperature,
      humidity,
      time: measureTime ? time - measureTime : -100
    };
  }

  async botUpdate({update_id, message}, tokenId, req, res) {
    console.log('new message', update_id, tokenId, message);

    if (!tokenId || tokenId !== process.env.TELEGRAM_UPDATE_TOKEN) {
      console.log('wrong update token');
      throw Error('Unknown token id');
    }

    await this.onBotMessage(message);

    res.end();
  }

  async onBotMessage({message_id, from, text}) {
    if (!from || !text) {
      return;
    }

    const { id, first_name } = from;

    console.log('new bot message', from, text, id, first_name);

    try {
      if (text.substring(0, 10) === '/subscribe') {
        await this.subscribe(id, text.substring(11), first_name);
      } else if (text.substring(0, 12) === '/unsubscribe') {
        await this.unsubscribe(id, text.substring(13));
      } else if (text === '/update') {
        await this.sendUpdates(id);
      }
    } catch (err) {
      this.sendMessage(id, err.message);
    }
  }

  async subscribe(userId, deviceId, firstName) {
    console.log(`subscribe user ${userId} to updates for ${deviceId}, username ${firstName}`);
    const ret = await this._database.subscribe({
      userId,
      deviceId,
      firstName
    });
    if (!ret.success) {
      await this.sendMessage(userId,'Already subscribed');
      return;
    }
    await this.sendMessage(userId, 'Subscribed successfully');
    if (ret.alert !== ALERT_NONE) {
      await this.sendMessage(userId, this.getAlertMessage(ret.alert));
    }
  }

  async unsubscribe(userId, deviceId) {
    console.log(`unsubscribe user ${userId} from updates for ${deviceId}`);
    const ret = await this._database.unsubscribe({
      userId,
      deviceId
    });
    if (ret) {
      await this.sendMessage(userId, 'Unsubscribed successfully');
    } else {
      await this.sendMessage(userId, 'You were not subscribed');
    }
  }

  async testSubscribe({userId, deviceId, firstName, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    return await this.subscribe(userId, deviceId, firstName);
  }

  async testUnsubscribe({userId, deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    return await this.unsubscribe(userId, deviceId);
  }

  async testGetSubscriptions({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    const subscriptions = await this._database.getSubscriptions({
      deviceId
    });
    return {
      subscriptions
    };
  }

  async testGetDevice({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    const device = await this._database.testGetDevice(deviceId);
    return {
      device
    };
  }

  async testFindSubscriptions({tokenId, maximumTemperature, minimumTime, minimumUpdateTime}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    const time = new Date().getTime();
    if (!maximumTemperature) {
      maximumTemperature = 400;
    }
    if (!minimumTime) {
      minimumTime = 30000;
    }
    if (!minimumUpdateTime) {
      minimumUpdateTime = 10000;
    }
    const subscriptions = await this._database.findSubscriptions({
      maximumTemperature,
      minimumTime: time - minimumTime,
      minimumUpdateTime: time - minimumUpdateTime
    });
    return {
      subscriptions
    };
  }

  async sendUpdates(userId) {
    const devices = await this._database.getUserDevices(userId);
    let message = '';
    for (const {deviceId, temperature, humidity} of devices) {
      if (message) {
        message += '\n';
      }
      message += `device ${deviceId.substring(0, 5)}: temperature ${temperature/10}, humidity ${humidity/10}`;
    }
    if (!message) {
      message = 'No subscriptions';
    }
    await this.sendMessage(userId, message);
  }

  async sendMessage(userId, message) {
    const apiToken = process.env.TELEGRAM_API_TOKEN;
    const url = `https://api.telegram.org/bot${apiToken}/sendMessage`;
    const body = {
      chat_id: userId,
      parse_mode: 'HTML',
      text: message
    };
    console.log(`sending message '${message}' to user ${userId}`);
    await axios.post(url, body);
  }

  getAlertMessage(alert) {
    let message;
    switch (alert) {
      case ALERT_TEMPERATURE:
        message = '<strong>Temperature Alert</strong>: Temperature is too high!';
        break;
      case ALERT_TIMEOUT:
        message = 'Measure timeout';
        break;
      case ALERT_NONE:
        message = 'Restored to normal state';
        break;
    }
    return message;
  }

  async backgroundTask() {

    if (this._inUpdate) {
      return;
    }

    const time = new Date().getTime();

    if (this._lastUpdate && time-this._lastUpdate < 5000) {
      return;
    }

    this._inUpdate = true;

    try {
      await this._database.updateDeviceAlerts({
        maximumTemperature: MAXIMUM_TEMPERATURE_ALERT,
        minimumTime: time-MINIMUM_MEASURE_TIME
      });

      const devices = await this._database.findSubscriptionsWithAlerts();

      for (const {deviceId, subscriptions, alert} of devices) {
        console.log(`got background check alert for device ${deviceId}, alert ${alert}`);
        const message = this.getAlertMessage(alert);
        for (const {userId} of subscriptions) {
          await this.sendMessage(userId, message);
        }
        await this._database.setDeviceLastAlert({
          deviceId,
          alert
        });
      }
    } catch(err) {
      console.log(err);
    }

    this._lastUpdate = new Date().getTime();
    this._inUpdate = false;
  }
}
