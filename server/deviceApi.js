import axios from 'axios'

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

    postTable.testSubscribe = this.testSubscribe.bind(this);
    postTable.testUnsubscribe = this.testUnsubscribe.bind(this);
    postTable.testFindSubscriptions = this.testFindSubscriptions.bind(this);
    postTable.testGetSubscriptions = this.testGetSubscriptions.bind(this);

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
    if (!tokenId || tokenId !== process.env.TELEGRAM_UPDATE_TOKEN) {
      throw Error('Unknown token id');
    }

    this.onBotMessage(message);

    res.end();
  }

  onBotMessage({message_id, from, text}) {
    if (!from || !text) {
      return;
    }

    const { id, first_name } = from;

    if (text.substring(0, 10) === '/subscribe') {
      this.subscribe(id, text.substring(11), first_name);
    } else if (text.substring(0, 12) === '/unsubscribe') {
      this.unsubscribe(id, text.substring(13));
    }
  }

  async subscribe(userId, deviceId, firstName) {
    await this._database.subscribe({
      userId,
      deviceId,
      firstName
    });
  }

  async unsubscribe(userId, deviceId) {
    await this._database.unsubscribe({
      userId,
      deviceId
    });
  }

  async testSubscribe({userId, deviceId, firstName, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    await this.subscribe(userId, deviceId, firstName);
    return {
      success: 1
    };
  }

  async testUnsubscribe({userId, deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    await this.unsubscribe(userId, deviceId);
    return {
      success: 1
    };
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

  async testFindSubscriptions({tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }
    const subscriptions = await this._database.findSubscriptions({
      maximumTemperature: 400,
      minimumTime: new Date().getTime() - 30000
    });
    return {
      subscriptions
    };
  }

  async sendMessage(userId, message) {
    const apiToken = process.env.TELEGRAM_API_TOKEN;
    const url = `https://api.telegram.org/bot${apiToken}/sendMessage`;
    const body = {
      chat_id: userId,
      parse_mode: 'HTML',
      text: message
    };
    await axios.post(url, body);
  }

  async backgroundTask() {
    // const subscriptionsList = await this._database.getSubscriptions();
    // const subscriptions = {};
    // for (const {deviceId, userId} of subscriptionsList) {
    //   const list = subscriptions[deviceId] || [];
    //   list.push(userId);
    //   subscriptions[deviceId] = list;
    // }
    // for (const deviceId of Object.keys(subscriptions)) {
    //   const time = new Date().getTime();
    //   const {temperature, measureTime} = this._database.getDeviceMeasures(deviceId);
    //   const temperatureAlert = temperature > 400;
    //   const measureAlert = time - measureTime > 30000;
    //   if (!temperatureAlert && !measureAlert) {
    //     continue;
    //   }
    //   const message = temperatureAlert ?
    //     `<strong>Temperature Alert</strong>: Temperature is ${temperature/10}` :
    //     `Measure timeout: ${(time-measureTime)/1000}s`;
    //   const userIds = subscriptions[deviceId];
    //   for (const userId of userIds) {
    //     this.sendMessage(userId, message);
    //   }
    // }
  }
}
