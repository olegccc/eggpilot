import {combineReducers} from 'redux';
import notifications from './Notifications';
import device from './Device';

export default combineReducers({
  notifications,
  device
});
