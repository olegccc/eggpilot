import React from 'react';
import Header from './Header';
import {SwipeableDrawer, Snackbar, Button} from "@material-ui/core";
import Drawer from './Drawer'
import networkService from '../utils/networkService'
import {connect} from 'react-redux';
import s from "./Layout.css";
import App from './App';

class Layout extends React.Component {

    constructor(props) {
        super(props);
        networkService.initialize(props.dispatch);
    }

    state = {
        openDrawer: false,
        message: ''
    };

    openDrawer = () => {
        this.setState({
            openDrawer: true
        });
    };

    closeDrawer = () => {
        this.setState({
            openDrawer: false
        });
    };

    componentDidUpdate(prevProps) {
        if (this.props.message && this.props.message !== prevProps.message) {
            this.setState({
                message: this.props.message
            });
        }
    }

    hideMessage = () => {
        this.setState({
            message: ''
        });
    };

    render() {
        const showSnackbar = !!this.state.message;
        return (
            <div id="content" className={s.content}>
                <Header openDrawer={this.openDrawer}/>
                <Snackbar
                    open={showSnackbar}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    autoHideDuration={6000}
                    onClose={this.hideMessage}
                    message={<span>{this.state.message}</span>}
                    action={[
                        <Button key="ok" color="secondary" size="small" onClick={this.hideMessage}>OK</Button>
                    ]}
                />
                <SwipeableDrawer onClose={this.closeDrawer} onOpen={this.openDrawer} open={this.state.openDrawer}>
                    <Drawer closeDrawer={this.closeDrawer}/>
                </SwipeableDrawer>
                <div className={s.body}>
                    <App/>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    message: state.notifications.get('message')
});

export default connect(mapStateToProps)(Layout);
