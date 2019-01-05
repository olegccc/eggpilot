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
      started: started - new Date().getTime()
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
}
