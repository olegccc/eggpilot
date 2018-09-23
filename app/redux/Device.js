import Device from '../actions/Device';
import {Map} from 'immutable';

const defaultState = Map({
  humidity: 0,
  started: 0,
  temperature: 0,
  deviceId: '',
  error: '',
  records: []
});

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
    case Device.STARTED:
      return state.set('started', action.started);
    case Device.NEW_MEASURE: {
      const { temperature, humidity } = action.measure;
      const oldRecords = state.get('records') || [];
      const newRecords = [...oldRecords, action.measure];
      return state
        .set('records', newRecords)
        .set('temperature', temperature)
        .set('humidity', humidity);
    }
  }
  return state;
}

export default reducer;
