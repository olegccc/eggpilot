const RE_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(objectId) {
  return objectId && RE_OBJECT_ID.test(objectId);
}

export default class Database {

  async initialize({MongoClient, ObjectId, Binary}) {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/eggpilot';
    console.log(`Initializing db with uri=${url}`);
    const db = await MongoClient.connect(url);
    this.db = db.db();
    this.ObjectId = ObjectId;
    this.Binary = Binary;

    const devices = await this.db.collection('devices').find().toArray();

    console.log('devices: ', devices);
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
      started: 1,
      stopped: 1,
      measureTime: 1,
      imageTime: 1
    });

    if (!device) {
      throw Error('Unknown device');
    }

    const {
      humidity,
      temperature,
      started,
      stopped,
      measureTime,
      imageTime
    } = device;

    const records = await this.db.collection('history').find({
      deviceId: this.ObjectId(deviceId)
    }).toArray();

    return {
      humidity,
      temperature,
      started: started ? started : null,
      stopped: stopped ? stopped : null,
      measureTime: measureTime ? measureTime : null,
      imageTime: imageTime ? imageTime : null,
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
      image: 1,
      imageTime: 1
    });

    if (!device) {
      throw Error('Unknown device');
    }

    const { image, imageTime } = device;
    if (!image) {
      return {
        image: null,
        lastImage: -1
      };
    }

    const buffer = image.read(0, image.length());

    return {
      image: buffer,
      imageTime
    };
  }

  async addDevice({time}) {
    if (!time) {
      time = new Date().getTime();
    }
    const result = await this.db.collection('devices').insertOne({
      created: time,
      started: null,
      stopped: null,
      measureTime: null,
      imageTime: null,
      temperature: null,
      humidity: null
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
  }

  async updateDevice({deviceId, temperature, humidity, time}) {

    if (!isValidObjectId(deviceId)) {
      throw Error('Unknown device');
    }
    const device = await this.db.collection('devices').findOne({
      _id: this.ObjectId(deviceId)
    }, {
      started: 1
    });
    if (!device || !device.started) {
      throw Error('Unknown device');
    }
    const result = await this.db.collection('devices').updateOne({
      _id: this.ObjectId(deviceId)
    }, {
      $set: {
        temperature,
        humidity,
        measureTime: time
      }
    });

    await this.db.collection('history').insertOne({
      deviceId: this.ObjectId(deviceId),
      temperature,
      humidity,
      time
    });

    return device;
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
        image: this.Binary(image),
        imageTime: new Date().getTime()
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
        started: new Date().getTime(),
        stopped: null,
        measureTime: null,
        imageTime: null
      }
    });
  }

  async stopMeasure({deviceId}) {
    await this.db.collection('devices').update({
      _id: this.ObjectId(deviceId)
    }, {
      $set: {
        stopped: new Date().getTime(),
        measureTime: null,
        imageTime: null
      }
    });
  }
}
