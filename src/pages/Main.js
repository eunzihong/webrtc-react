import React, {useState} from 'react';
import {Link} from "react-router-dom";

function Main(props) {
    const [myName, setMyName] = useState("");
    return (
        <>
            <div>Hello World! It's Main page.</div>
            <div>
                <input value={myName} onChange={(event) => setMyName(event.target.value)}/>
                <Link to={{
                    pathname:'/multi',
                    state: {name: myName}
                }}>multi SFU room enter</Link>
            </div>
        </>
    );
};

export default Main;