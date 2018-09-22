import React from 'react';
import s from "./App.css";
import {connect} from 'react-redux';
import Image from './Image'

const App = ({
                 temperature,
                 humidity
}) => {
    let temperature1 = Math.trunc(temperature/10)*10;
    const temperature2 = temperature-temperature1;
    temperature1 /= 10;
    let humidity1 = Math.trunc(humidity/10)*10;
    const humidity2 = humidity-humidity1;
    humidity1 /= 10;
    return (<div className={s.root}>
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
        <Image/>
    </div>);
};

const mapStateToProps = state => ({
    humidity: state.notifications.get('humidity'),
    temperature: state.notifications.get('temperature')
});

const mapDispatchToProps = () => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
