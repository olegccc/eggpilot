export default class Notifications {
  static CONNECTION_STATUS = 'CONNECTION_STATUS';

  static connectionStatus(status) {
    return {
      type: Notifications.CONNECTION_STATUS,
      status
    };
  }
}
