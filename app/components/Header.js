import React from 'react';
import { AppBar,
  Toolbar,
  Typography } from '@material-ui/core';
import s from './Header.css';
import {connect} from 'react-redux';

const routeNameMapping = {
    '/': '',
    '/settings': 'Settings'
};

const Header = ({openDrawer, location, status}) => {

    const routeName = routeNameMapping[location.pathname] || '';

    return (<div className={s.appBar}>
        <AppBar position="static">
            <Toolbar>
                <Typography variant="title">
                    <span className={s.title}>EggPilot</span>
                    {routeName && <span> :: {routeName}</span>}
                    {status !== 'connected' && <span> - {status}</span>}
                </Typography>
            </Toolbar>
        </AppBar>
    </div>);
};

const mapStateToProps = state => ({
    status: state.notifications.get('connectionStatus')
});

export default withRouter(connect(mapStateToProps)(Header));
