import React from 'react';
import ReactDOM from 'react-dom';
//Lib
import './lib';

//Style
import './styles/index.scss';

//Components
import App from './components/layout/App.jsx';



//Service worker
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

import * as serviceWorker from './serviceWorker';

serviceWorker.unregister();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

