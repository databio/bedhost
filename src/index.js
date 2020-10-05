import React from "react";
import ReactDOM from "react-dom";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";
import Home from "./Home";
// import Bedset from './Bedset';
// import Bedfile from './Bedfile';
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";



ReactDOM.render(
  <Router>
      <Switch>
        <Route path="/" component={Home}/>
        {/* <Route path="/bedsetsplash/:bedset" component={Bedset}/>
        <Route path="/bedfilesplash/:bedset/:bedfile" component={Bedfile}/> */}
      </Switch>
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
