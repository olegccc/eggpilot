import Device from '../actions/Device'

export function intervalToString(time, add = true) {
  //const millis = time % 1000;
  time = Math.floor(time / 1000);
  const seconds = time % 60;
  time = Math.floor(time / 60);
  const minutes = time % 60;
  time = Math.floor(time / 60);
  const hours = time % 24;
  const days = Math.floor(time / 24);
  const postfix = add ? ' ago' : '';
  if (days) {
    return `${days} days${postfix}`;
  }
  if (hours) {
    return `${hours} hours${postfix}`;
  }
  if (minutes) {
    return `${minutes} minutes${postfix}`;
  }
  if (seconds < 30) {
    return `half a minute$${postfix}`;
  }
  if (seconds > 3) {
    return `${seconds} seconds${postfix}`;
  }
  return 'now';
}

export function setupRefreshMeasureTime(dispatch) {
  setInterval(() => {
    dispatch(Device.updateMeasureTime());
  }, 2000);
}
