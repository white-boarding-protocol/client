import './App.css';
import React from "react";
import {useState, useEffect} from "react";

import Canvas from "./components/Canvas";
import Interface from "./interface/interface";
import {v4 as uuidv4} from 'uuid';
import Dashboard from "./components/Dashboard";
import ServerConnection from "./services/serverConnection";


let serverInterface = null;
let serverConnection = null;

function App( ) {

    const [currentUserId, setCurrentUserId] = useState("user_"+uuidv4());
    const [connectServer, setConnectServer] = useState(true);
    const [showCanvas, setShowCanvas] = useState(false);
    const [displayForm, setDisplayForm] = useState(true);
    const [message, setMessage] = useState("");
    const [usersInQueue, setUsersInQueue] = useState([]);
    const [previousEvents, setPreviousEvents] = useState([]);

    const joinRoomHandler = (roomId) => {
        setDisplayForm(false);
        setMessage("Joining room " + roomId);

        serverInterface.requestJoinRoom(roomId).then((msg) => {
            console.log("Join room response: ", msg);
        }).catch((msg) => {
            console.log("declined")
        })
    }

    const createRoomHandler = () => {
        setDisplayForm(false);
        setMessage("Creating room...")

         serverInterface.createRoom().then((msg) => {
             console.log("Create room response: ", msg);
             setShowCanvas(true);
             serverConnection.setPreviousEvents([]);
         }).catch((msg) => {
             setMessage("Error creating room, " + msg);
             console.log(msg)
         })

    }

    const userApprovalHandler = (userId, approved) => {
        setUsersInQueue( usersInQueue.filter( u => u !== userId ) )
        if (approved){
            serverInterface.acceptUserJoinRequest(userId).then((msg) => {
                console.log("accepted user request to join")
            })
        }else {
            serverInterface.declineJoin(userId).then((msg) => {
                console.log("declined user request to join")
            })
        }
    }

    const endRoomHandler = () => {
        serverInterface.leaveRoom().then(() => {
            console.log("user exited room");
            setMessage("Exited.");
        })
    }

    const cbSocketHasBeenClosed = () => {
        console.log("socket has been closed");
        setMessage("Socket closed.");
        setShowCanvas(false);
        setDisplayForm(false);
    }


    const cbApprovalRequest = (approved, message) => {
        const {events} = message;
        if (approved){
            console.log("host approved join request.", message);
            setMessage("Host approved join request.");
            setPreviousEvents(events);
            setMessage("room joined. canvas should open");
            setShowCanvas(true);
            serverConnection.setPreviousEvents(events);
        }else {
            console.log("host declined join request. ", message);
            setMessage("Host declined join request.");
        }
    }

    const cbUserWantsToJoin = (msg) => {
        const {user_id} = msg;
        console.log(user_id);
        setUsersInQueue((prevState) => [...prevState, user_id]);
    }

    useEffect(() => {
        if (connectServer || serverInterface === null){
            console.log("current user id ", currentUserId);
            serverInterface = new Interface(
                currentUserId, "wss://SEP:5555", './cert/cert.pem',
                cbSocketHasBeenClosed,
                (msg) => {
                    console.log("Server responds load room");
                    cbApprovalRequest(true, msg)
                },
                (msg) => {
                    console.log("Server responds reject join");
                    cbApprovalRequest(false, msg);
                },
                cbUserWantsToJoin
            );
            serverConnection = new ServerConnection(serverInterface);
            serverInterface.connect().then(msg => {
                console.log("Connection to server: ", msg);
            })
            setConnectServer(false);
        }
    })

    return (
    <div className="App">
        {
            showCanvas ?
                <Canvas
                    roomId={serverInterface.roomId}
                    serverConnection={serverConnection}
                    queuedUsers={usersInQueue}
                    onUserApproval={userApprovalHandler}
                    cbEndRoom={endRoomHandler}
                /> :
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
