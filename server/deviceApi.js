export default class DeviceApi {
  constructor(postTable, getTable, database, production) {
    this._database = database;
    postTable.addDevice = this.addDevice.bind(this);
    postTable.removeDevice = this.removeDevice.bind(this);
    postTable.updateDevice = this.updateDevice.bind(this);
    postTable.startMeasure = this.startMeasure.bind(this);

    if (!production) {
      getTable.createDevice = this.createDevice.bind(this);
    }
  }

  async createDevice(body, rest, req, res) {

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

    for (const record of records) {
      const temperature = record[0];
      const humidity = record[1];
      console.log('time', time);
      await this._database.updateDevice({deviceId: deviceId.toString(), temperature, humidity, time});
      time += 10000;
    }

    res.redirect(`http://${req.headers.host}/#/device/${deviceId}`);
  }

  async addDevice({tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    return await this._database.addDevice();
  }

  async removeDevice({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    return await this._database.removeDevice({
      deviceId
    });
  }

  async updateDevice({deviceId, temperature, humidity}) {
    return await this._database.updateDevice({
      deviceId, temperature, humidity
    });
  }

  async startMeasure({deviceId, tokenId}) {
    if (tokenId !== process.env.TOKEN_ID) {
      throw Error('Unknown token id');
    }

    return await this._database.startMeasure({deviceId});
  }
}
