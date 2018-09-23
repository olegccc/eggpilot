import React from 'react'
import c3 from 'c3';
import {connect} from 'react-redux';

class Chart extends React.Component {
  componentDidMount() {
    this._updateChart();
  }

  componentDidUpdate() {
    this._updateChart();
  }

  _updateChart() {

    const columnHumidity = [
      'Humidity'
    ];

    const columnTemperature = [
      'Temperature'
    ];

    const columnTime = ['x'];

    const {records, started} = this.props;

    for (const record of records) {
      columnHumidity.push(record.humidity/10);
      columnTemperature.push(record.temperature/10);
      columnTime.push(record.time-started);
    }

    const columns = [columnHumidity, columnTemperature, columnTime];

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
  }

  render() {
    return (<div id="chart" />);
  }
}

const mapStateToProps = state => ({
  records: state.device.get('records') || [],
  started: state.device.get('started')
});

export default connect(mapStateToProps)(Chart);
