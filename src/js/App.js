import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import WifiTrackerMap from './containers/WifiTrackerMap';
import TestingMap from './containers/TestingMap';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import 'Styles/App.scss';
import "@babel/polyfill";

class App extends Component {
  render() {
    return<div>
      <Router>
       <div>
         <Route path="/" exact component={WifiTrackerMap} />
         <Route path="/map" component={WifiTrackerMap} />
       </div>
      </Router>
    </div>;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
