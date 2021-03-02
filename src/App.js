import React, {useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Main from "./pages/Main";
import WebrtcLocalConnection from "./components/WebrtcLocalConnection";
import WebrtcRemoteConnection from "./components/WebrtcRemoteConnection";
import WebrtcSingleSfuConnection from "./components/WebrtcSingleSfuConnection";
import WebrtcMultiSfuConnection from "./components/WebrtcMultiSfuConnection";

function App() {

  return (
      <div className="App">
          <Router>
              <Switch>
                  <Route exact path="/" component={Main} />
                  <Route exact path="/local" component={WebrtcLocalConnection} />
                  <Route exact path="/remote" component={WebrtcRemoteConnection} />
                  <Route exact path="/single" component={WebrtcSingleSfuConnection} />
                  <Route exact path="/multi" component={WebrtcMultiSfuConnection} />
              </Switch>
          </Router>
      </div>
  );
}

export default App;