import React from "react";
import ReactDOM from "react-dom";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";
import Home from "./home";
import BedSetSplash from './bedSetSplash';
import BedFileSplash from './bedFileSplash';
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";



ReactDOM.render(
  <Router>
      <Switch>
        <Route exact path="/" component={Home}/>
        <Route path="/bedsetsplash/:bedset" component={BedSetSplash}/>
        <Route path="/bedfilesplash/:bedfile" component={BedFileSplash}/>
      </Switch>
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
