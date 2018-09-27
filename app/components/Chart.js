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

  _updateChart() {

    const columnHumidity = [
      'Humidity'
    ];

    const columnTemperature = [
      'Temperature'
    ];

    const columnTime = ['x'];

    const {records} = this.props;

    for (const record of records) {
      columnHumidity.push(record.humidity/10);
      columnTemperature.push(record.temperature/10);
      columnTime.push(record.time);
    }

    const columns = [columnHumidity, columnTemperature, columnTime];

    if (!this._chart) {
      this._chart =
        c3.generate({
          bindto: '#chart',
          size: {
            height: '500',
          },
          data: {
            x: 'x',
            columns,
            type: 'spline',
            axes: {
              'Temperature': 'y2'
            }
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
        columns
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
