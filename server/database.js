const RE_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(objectId) {
  return objectId && RE_OBJECT_ID.test(objectId);
}

export default class Database {

  async initialize({MongoClient, ObjectId}) {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/eggpilot';
    const db = await MongoClient.connect(url);
    this.db = db.db();
    this.ObjectId = ObjectId;
  }

  async getDeviceMeasures(deviceId) {
    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }

    const device = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    });

    if (!device) {
      throw Error('Unknown device');
    }

    const {humidity, temperature, started} = device;

    const records = await this.db.collection('history').find({
      deviceId: this.ObjectId(deviceId)
    }).toArray();

    return {
      humidity,
      temperature,
      started,
      records: records.map(({temperature, humidity, time}) => ({temperature, humidity, time}))
    };
  }

  async addDevice({time}) {
    if (!time) {
      time = new Date().getTime();
    }
    const result = await this.db.collection('devices').insertOne({
      created: time,
      started: time
    });
    return {
      deviceId: result.insertedId,
      success: true
    };
  }

  async removeDevice({deviceId}) {
    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }
    await this.db.collection('devices').removeOne({
      _id: this.ObjectId(deviceId)
    });
    await this.db.collection('history').removeMany({
      deviceId: this.ObjectId(deviceId)
    });
    return {
      success: true
    };
  }

  async updateDevice({deviceId, temperature, humidity, time}) {
    if (!isValidObjectId(deviceId)) {
      console.log('unknown device id: ', deviceId);
      throw Error('Unknown device');
    }
    const result = await this.db.collection('devices').updateOne({
      _id: this.ObjectId(deviceId)
    }, {
      $set: {
        temperature,
        humidity
      }
    });
    if (result.modifiedCount !== 1) {
      throw Error('Unknown device');
    }

    console.log(`update device: ${deviceId}, ${temperature}, ${humidity}, ${time}`);

    if (!time) {
      time = new Date().getTime();
    }

    console.log(`update device: ${deviceId}, ${temperature}, ${humidity}, ${time}`);

    await this.db.collection('history').insertOne({
      deviceId: this.ObjectId(deviceId),
      temperature,
      humidity,
      time
    });
    return {
      success: true
    };
  }

  async startMeasure({deviceId}) {
    await this.db.collection('history').remove({
      deviceId: this.ObjectId(deviceId)
    });
    await this.db.collection('devices').update({
      _id: this.ObjectId(deviceId)
    }, {
      $set: {
        started: new Date().getTime()
      }
    });
  }
}
