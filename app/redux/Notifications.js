import Notifications from '../actions/Notifications';
import {Map} from 'immutable';

const defaultState = Map({
  connectionStatus: '',
  humidity: 0,
  temperature: 0
});

function reducer(state = defaultState, action) {
    switch (action.type) {
      case Notifications.CONNECTION_STATUS:
        return state.set('connectionStatus', action.status);
    }
    return state;
}

export default reducer;
