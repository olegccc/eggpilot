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
  if (days === 1) {
    return `1 day ${hours} hours${postfix}`;
  }
  if (days > 0 && days < 5) {
    return `${days} days ${hours} hours${postfix}`;
  }
  if (days) {
    return `${days} days${postfix}`;
  }
  if (hours === 1) {
    return `1 hour ${minutes} minutes${postfix}`;
  }
  if (hours > 0 && hours < 5) {
    return `${hours} hours ${minutes} minutes${postfix}`;
  }
  if (hours) {
    return `${hours} hours${postfix}`;
  }
  if (minutes === 1) {
    return `1 minute ${seconds} seconds${postfix}`;
  }
  if (minutes > 0 && minutes < 5) {
    return `${minutes} minutes ${seconds} seconds${postfix}`;
  }
  if (minutes) {
    return `${minutes} minutes${postfix}`;
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
