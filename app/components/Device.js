import React from 'react';
import s from "./Device.css";
import {connect} from 'react-redux';
import Image from './Image'
import {withRouter} from 'react-router';
import ActionDevice from '../actions/Device'
import networkService from '../utils/networkService'
import Chart from './Chart'

class Device extends React.Component {

  componentDidMount() {
    this._onDeviceChanged();
  }

  componentDidUpdate() {
    this._onDeviceChanged();
  }

  _onDeviceChanged() {
    const {deviceId, routerDeviceId, setDeviceId} = this.props;
    if (deviceId === routerDeviceId) {
      return;
    }
    networkService.setDevice(routerDeviceId);
    setDeviceId(routerDeviceId);
  }

  render() {

    const {
      temperature,
      humidity,
      routerDeviceId,
      deviceId,
      deviceError,
      sinceStarted,
      sinceStopped
    } = this.props;

    if (deviceId !== routerDeviceId) {
      return <div/>;
    }
    if (deviceError) {
      return <div>{deviceError}</div>;
    }
    if (temperature === 0 || humidity === 0) {
      return <div/>;
    }
    let temperature1 = Math.trunc(temperature / 10) * 10;
    const temperature2 = temperature - temperature1;
    temperature1 /= 10;
    let humidity1 = Math.trunc(humidity / 10) * 10;
    const humidity2 = humidity - humidity1;
    humidity1 /= 10;
    return (<div className={s.root}>
      <div className={s.stats}>
        <span>Started: {sinceStarted}</span>{sinceStopped && <span>; Stopped: {sinceStopped}</span>}
      </div>
      <div className={s.meters}>
        <div className={s.temperature}>
          <div className={s.title}>Temperature</div>
          <div className={s.value}>
                <span className={s.valueInt}>
                    {temperature1}
                  <span className={s.valueAfterDot}>.{temperature2}</span>
                    <span className={s.valueDimension}>&nbsp;{'\u00B0'}C</span>
                </span>
          </div>
        </div>
        <div className={s.humidity}>
          <div className={s.title}>Humidity</div>
          <div className={s.value}>
                <span className={s.valueInt}>
                    {humidity1}
                  <span className={s.valueAfterDot}>.{humidity2}</span>
                    <span className={s.valueDimension}>&nbsp;%</span>
                </span>
          </div>
        </div>
      </div>
      <Chart/>
      <Image/>
    </div>);
  }
}

const mapStateToProps = (state, props) => ({
  humidity: state.device.get('humidity'),
  temperature: state.device.get('temperature'),
  deviceId: state.device.get('deviceId'),
  routerDeviceId: props.routeParams.deviceId,
  deviceError: state.device.get('error'),
  sinceStarted: state.device.get('sinceStarted'),
  sinceStopped: state.device.get('sinceStopped')
});

const mapDispatchToProps = dispatch => ({
  setDeviceId: deviceId => {
    dispatch(ActionDevice.setDeviceId(deviceId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Device));
