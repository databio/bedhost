import React from "react";
import ReactDOM from "react-dom";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import Home from "./home";
import About from "./about";
import BedSetSplash from './bedSetSplash';
import BedSplash from './bedSplash';
import "bootstrap/dist/css/bootstrap.min.css";

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);

ReactDOM.render(
  <Router history={Router.hashHistory}>
    <Switch >
      <Route exact path="/" component={Home} />
      <Route exact path="/about" component={About} />
      <Route path="/bedsetsplash/:bedset_md5sum" component={BedSetSplash} />
      <Route path="/bedsplash/:bed_md5sum" component={BedSplash} />
    </Switch>
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
