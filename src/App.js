import React from 'react';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Main from "./pages/Main";
import WebrtcVideo from "./components/WebrtcVideo";

function App() {
  return (
      <div className="App">
          <Router>
              <Switch>
                  {/*<Route exact path="/" component={Main} />*/}
                  <Route exact path="/" component={WebrtcVideo} />
              </Switch>
          </Router>
      </div>
  );
}

export default App;