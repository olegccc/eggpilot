import Device from '../actions/Device';
import {Map} from 'immutable';
import {intervalToString} from "../utils/time";

const defaultState = Map({
  humidity: 0,
  temperature: 0,
  deviceId: '',
  error: '',
  records: [],
  image: null,
  timeStats: {
    started: null,
    stopped: null,
    measureTime: null,
    imageTime: null
  },
  sinceStarted: '',
  sinceStopped: '',
  lastImage: '',
  lastMeasure: ''
});

const MAX_MEASURE_TIME = (1000*60*20);
const LONG_TIME_AGO = 'a long time ago';
const NEVER_UPDATED = 'never';

function updateMeasureTime(state) {
  let {measureTime, imageTime, started, stopped} = state.get('timeStats');
  if (!measureTime && !imageTime && !started && !stopped) {
    const timePassed = state.get('timePassed') || {};
    if (Object.keys(timePassed).length > 0) {
      return state.set('timePassed', {});
    } else {
      return state;
    }
  }
  const time = new Date().getTime();

  if (!measureTime) {
    measureTime = NEVER_UPDATED;
  } else {
    measureTime = time - measureTime;
    if (measureTime > MAX_MEASURE_TIME) {
      measureTime = LONG_TIME_AGO;
    } else {
      measureTime = intervalToString(measureTime);
    }
  }

  if (!imageTime) {
    imageTime = NEVER_UPDATED;
  } else {
    imageTime = time - imageTime;
    if (imageTime > MAX_MEASURE_TIME) {
      imageTime = LONG_TIME_AGO;
    } else {
      imageTime = intervalToString(imageTime);
    }
  }

  if (!started) {
    started = NEVER_UPDATED;
  } else {
    started = intervalToString(time - started);
  }

  if (!stopped) {
    stopped = '';
  } else {
    stopped = intervalToString(time - stopped);
  }

  const labels = {
    lastMeasure: measureTime,
    lastImage: imageTime,
    sinceStarted: started,
    sinceStopped: stopped
  };

  for (const key of Object.keys(labels)) {
    if (state.get(key) !== labels[key]) {
      state = state.set(key, labels[key]);
    }
  }

  return state;
}

function reducer(state = defaultState, action) {
  switch (action.type) {
    case Device.MEASURES:
      return state
        .set('humidity', action.humidity)
        .set('temperature', action.temperature);
    case Device.RECORDS:
      return state.set('records', action.records);
    case Device.DEVICE_ID:
      return state
        .set('humidity', 0)
        .set('temperature', 0)
        .set('error', '')
        .set('started', 0)
        .set('records', [])
        .set('deviceId', action.deviceId);
    case Device.DEVICE_ERROR:
      return state.set('error', action.message || 'Error');
    case Device.NEW_MEASURE: {
      const {temperature, humidity} = action.measure;
      const oldRecords = state.get('records') || [];
      const newRecords = [...oldRecords, action.measure];
      return state
        .set('records', newRecords)
        .set('temperature', temperature)
        .set('humidity', humidity);
    }
    case Device.IMAGE:
      return state.set('image', action.image);
    case Device.UPDATE_MEASURE_TIME:
      return updateMeasureTime(state);
    case Device.TIME_STATS: {
      const newStats = {...state.get('timeStats')};
      for (const key of Object.keys(action.stats)) {
        if (key === 'started' && (action.stats[key] || action.stats[key] === null) && !newStats[key]) {
          state = state.set('records', []);
        }
        newStats[key] = action.stats[key];
      }
      return updateMeasureTime(state.set('timeStats', newStats));
    }
  }
  return state;
}

export default reducer;
