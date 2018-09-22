import React from 'react';
import { AppBar,
  Toolbar,
  Typography } from '@material-ui/core';
import s from './Header.css';
import {connect} from 'react-redux';

const Header = ({openDrawer, location, status}) => {

    return (<div className={s.appBar}>
        <AppBar position="static">
            <Toolbar>
                <Typography variant="title">
                    <span className={s.title}>EggPilot</span>
                    {status && status !== 'connected' && <span> - {status}</span>}
                </Typography>
            </Toolbar>
        </AppBar>
    </div>);
};

const mapStateToProps = state => ({
    status: state.notifications.get('connectionStatus')
});

export default connect(mapStateToProps)(Header);
