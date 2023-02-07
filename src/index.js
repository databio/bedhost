import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import Main from "./Main";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";
import './style/index.css';

function App() {
  return (
    <HashRouter>
      <Main />
    </HashRouter>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();