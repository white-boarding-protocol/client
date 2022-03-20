import './App.css';
import React from "react";
import {useState} from "react";

import Canvas from "./components/Canvas";
//import Session from "./session/session.js";
import Interface from "./interface/interface.js";
import Dashboard from "./components/Dashboard";
//import fs from 'fs';

// TODO: Later to be replaced with enc layer function
//const ssl_context = {ca: fs.readFileSync('./cert/cert.pem')}

// Session layer
//const new_session = new Session("wss://SEP:5555", ssl_context);

const wb = new Interface("150", "wss://SEP:5555", './cert/cert.pem', () => {
}, (msg) => {
    console.log("loading room")
    wb.leaveRoom().then(() => {
        console.log("left room")
    })
}, (msg) => {
    console.log("host declined")
}, (msg) => {
    wb.acceptUserJoinRequest(msg.user_id).then((msg) => {
        console.log("accepted user request to join")
    })
});


wb.connect().then(() => {
    console.log(wb.whiteboarding.isConnected)
    wb.requestJoinRoom("room_09f2793a-a7ab-11ec-a05a-91d550d4e960").then((msg) => {
        console.log("accepted")
    }).catch((msg) => {
        console.log("declined")
    })
})


// wb.connect().then(() => {
//     console.log(wb.whiteboarding.isConnected)
//     wb.createRoom().then((msg) => {
//         console.log(msg)
//     }).catch((msg) => {
//         console.log(msg)
//     })
// })

function App() {

    const [showCanvas, setShowCanvas] = useState(false);
    const [displayForm, setDisplayForm] = useState(true);
    const [message, setMessage] = useState("");
    const [usersInQueue, setUsersInQueue] = useState([]);

    const joinRoomHandler = (roomId) => {
        //todo: join room here
        setDisplayForm(false);
        setMessage("Joining room " + roomId);
    }

    const createRoomHandler = () => {
        //todo: create room here
        setDisplayForm(false);
        setMessage("Creating room...")
    }

    return (
    <div className="App">
        { showCanvas ?
            <Canvas /> :
            <Dashboard
                joinBtnHandler={joinRoomHandler}
                createBtnHandler={createRoomHandler}
                displayForm={ displayForm }
                message={message}
            />
        }
    </div>
  );
}

export default App;
