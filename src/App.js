import React, {useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Main from "./pages/Main";
import WebrtcLocalConnection from "./components/WebrtcLocalConnection";
import WebrtcRemoteConnection from "./components/WebrtcRemoteConnection";
import WebrtcSfuConnection from "./components/WebrtcSfuConnection";

function App() {

  return (
      <div className="App">
          <Router>
              <Switch>
                  <Route exact path="/main" component={Main} />
                  <Route exact path="/local" component={WebrtcLocalConnection} />
                  <Route exact path="/remote" component={WebrtcRemoteConnection} />
                  <Route exact path="/" component={WebrtcSfuConnection} />
              </Switch>
          </Router>
      </div>
  );
}

export default App;