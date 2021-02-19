import React, {useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Main from "./pages/Main";
import WebrtcLocalConnection from "./components/WebrtcLocalConnection";
import WebrtcRemoteConnection from "./components/WebrtcRemoteConnection";

function App() {

  return (
      <div className="App">
          <Router>
              <Switch>
                  <Route exact path="/" component={Main} />
                  <Route exact path="/local" component={WebrtcLocalConnection} />
                  <Route exact path="/remote" component={WebrtcRemoteConnection} />
              </Switch>
          </Router>
      </div>
  );
}

export default App;