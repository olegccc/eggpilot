import React from 'react';
import {Router, Route, IndexRoute} from 'react-router';
import {hashHistory} from 'react-router';

import Device from './Device';
import Home from './Home'
import Layout from './Layout';

const router = (
  <Router history={hashHistory}>
    <Route component={Layout}>
      <IndexRoute components={{main: Home}}/>
      <Route path="/device/:deviceId" components={{main: Device}}/>
      <Route path="*" components={{main: Home}}/>
    </Route>
  </Router>);

export default router;
