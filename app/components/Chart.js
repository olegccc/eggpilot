import React from 'react'
import c3 from 'c3';
import {connect} from 'react-redux';
import s from "./Device.css";

class Chart extends React.Component {
  componentDidMount() {
    this._updateChart();
  }

  componentDidUpdate() {
    this._updateChart();
  }

  componentWillUnmount() {
    this._chart = undefined;
  }

  _refreshColumns() {
    const {records} = this.props;
    if (this._columnHumidity && this._columnHumidity.length-1 > records.length) {
      this._columnHumidity = undefined;
      this._columnTemperature = undefined;
      this._columnTime = undefined;
    }
    this._columnHumidity = this._columnHumidity || ['Humidity'];
    this._columnTime = this._columnTime || ['x'];
    this._columnTemperature = this._columnTemperature || ['Temperature'];
    this._columns = this._columns || [this._columnHumidity, this._columnTemperature, this._columnTime];
    let startIndex = this._columnHumidity.length-1;
    let endIndex = records.length;
    if (startIndex === endIndex) {
      return false;
    }
    this._columnHumidity.length = endIndex+1;
    this._columnTime.length = endIndex+1;
    this._columnTemperature.length = endIndex+1;
    for (let i = startIndex; i < endIndex; i++) {
      const record = records[i];
      this._columnHumidity[i+1] = record.humidity/10;
      this._columnTemperature[i+1] = record.temperature/10;
      this._columnTime[i+1] = record.time;
    }
    return true;
  }

  _updateChart() {

    if (!this._refreshColumns() && this._chart) {
      return;
    }

    if (!this._chart) {
      this._chart =
        c3.generate({
          bindto: '#chart',
          size: {
            height: '500',
          },
          data: {
            x: 'x',
            columns: this._columns,
            type: 'spline',
            axes: {
              'Temperature': 'y2'
            }
          },
          subchart: {
            show: true
          },
          color: {
            pattern: ['rgb(11, 216, 11)', 'rgb(67,180,236)']
          },
          axis: {
            y: {
              label: {
                text: 'Humidity',
                position: 'outer-middle'
              },
              tick: {
                format: function(x) {
                  return `${x.toFixed(2)}%`;
                }
              }
            },
            y2: {
              show: true,
              label: {
                text: 'Temperature',
                position: 'outer-middle'
              },
              tick: {
                format: function(x) {
                  return `${x.toFixed(2)}\u2103`;
                }
              }
            },
            x: {
              tick: {
                format: function(x) {
                  x = Math.floor(x/1000);
                  const sec = x % 60;
                  x = Math.floor(x/60);
                  const min = x % 60;
                  x = Math.floor(x/60);
                  const hour = x % 24;
                  const day = Math.floor(x/24);
                  return `${day}d ${('0'+hour).substr(-2, 2)}:${('0'+min).substr(-2, 2)}:${('0'+sec).substr(-2,2)}`;
                }
              }
            }
          }
        });
    } else {
      this._chart.load({
        columns: this._columns
      });
    }
  }

  render() {
    const {lastMeasure} = this.props;
    return <div className={s.root}>
      <div className={s.stats}>Last measure: {lastMeasure}</div>
      <div id="chart" />
    </div>;
  }
}

const mapStateToProps = state => ({
  records: state.device.get('records') || [],
  lastMeasure: state.device.get('lastMeasure')
});

export default connect(mapStateToProps)(Chart);
