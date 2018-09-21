import React from 'react';
import {connect} from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Layout from './Layout';

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#55ccff'
        },
        secondary: {
            main: '#0044ff'
        }
    },
});

class Root extends React.Component {
    componentDidMount() {
        // TODO: initialize store
    }

    render() {
        return (<MuiThemeProvider theme={theme}>
            <Layout/>
        </MuiThemeProvider>);
    }
}

export default connect()(Root);
