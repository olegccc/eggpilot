import React from 'react';
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import Root from './components/Root';
import reducers from './redux';

const store = createStore(reducers, applyMiddleware(thunk));

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<Provider store={store}>
          <Root />
      </Provider>, document.querySelector('#app'));
});
