const RE_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(objectId) {
  return objectId && RE_OBJECT_ID.test(objectId);
}

export default class Database {

  async initialize({MongoClient, ObjectId, Binary}) {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/eggpilot';
    const db = await MongoClient.connect(url);
    this.db = db.db();
    this.ObjectId = ObjectId;
    this.Binary = Binary;
  }

  async getDeviceMeasures(deviceId) {
    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }

    const device = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    }, {
      humidity: 1,
      temperature: 1,
      started: 1
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

  async getDeviceImage(deviceId) {
    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }

    const device = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    }, {
      image: 1
    });

    if (!device) {
      throw Error('Unknown device');
    }

    const { image } = device;
    if (!image) {
      return {
        image: null
      };
    }

    const buffer = image.read(0, image.length());

    return {
      image: buffer
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
      deviceId: result.insertedId
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

    await this.db.collection('history').insertOne({
      deviceId: this.ObjectId(deviceId),
      temperature,
      humidity,
      time
    });

    const {
      started
    } = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    });

    return {
      timePassed: Math.floor((new Date().getTime()-started)/1000)
    };
  }

  async updateImage({deviceId, image}) {
    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }

    const device = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    });

    const result = await this.db.collection('devices').updateOne({
      _id: this.ObjectId(deviceId)
    }, {
      $set: {
        image: this.Binary(image)
      }
    });
    if (result.modifiedCount !== 1) {
      throw Error('Unknown device');
    }
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
