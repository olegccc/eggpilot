import React from 'react';
import Header from './Header';
import {Snackbar, Button} from "@material-ui/core";
import networkService from '../utils/networkService'
import {connect} from 'react-redux';
import s from "./Layout.css";
import {setupRefreshMeasureTime} from "../utils/time";

class Layout extends React.Component {

  constructor(props) {
    super(props);
    networkService.initialize(props.dispatch);
    setupRefreshMeasureTime(props.dispatch);
  }

  state = {
    message: ''
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
        <Header/>
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
        <div className={s.body}>
          {this.props.main}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  message: state.notifications.get('message')
});

export default connect(mapStateToProps)(Layout);
