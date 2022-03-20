import './App.css';
import React from "react";
import {useState, useEffect} from "react";

import Canvas from "./components/Canvas";
import Interface from "./interface/interface";
import {v4 as uuidv4} from 'uuid';
import Dashboard from "./components/Dashboard";
import {parseEventToElement, parseElementToEvent} from "./components/canvasServiceUtils";


let serverInterface = null;

function App( ) {

    const [currentUserId, setCurrentUserId] = useState("user_"+uuidv4());
    const [connectServer, setConnectServer] = useState(true);
    const [showCanvas, setShowCanvas] = useState(false);
    const [displayForm, setDisplayForm] = useState(true);
    const [message, setMessage] = useState("");
    const [usersInQueue, setUsersInQueue] = useState([]);
    const [allElements, setAllElements] = useState([]);

    // display form - join button handler
    const joinRoomHandler = (roomId) => {
        setDisplayForm(false);
        setMessage("Joining room " + roomId);

        serverInterface.requestJoinRoom(roomId).then((msg) => {
            console.log("Join room response: ", msg);
        }).catch((msg) => {
            console.log("declined")
        })
    }

    // display form - create room button handler
    const createRoomHandler = () => {
        setDisplayForm(false);
        setMessage("Creating room...")

         serverInterface.createRoom().then((msg) => {
             console.log("Create room response: ", msg);
             setShowCanvas(true);
             setAllElements([])
         }).catch((msg) => {
             setMessage("Error creating room, " + msg);
             console.log(msg)
         })

    }

    // interface - socket closed
    const cbSocketHasBeenClosed = () => {
        console.log("socket has been closed");
        setMessage("Socket closed.");
        setShowCanvas(false);
        setDisplayForm(false);
    }

    // interface - join request approved or denied
    const cbApprovalRequest = (approved, message) => {
        const {events} = message;
        if (approved){
            events.forEach( e => cbNewEvents(e) );
            console.log("host approved join request.", message);
            setMessage("Host approved join request.");
            setShowCanvas(true);
        }else {
            console.log("host declined join request. ", message);
            setMessage("Host declined join request.");
        }
    }

    // interface - user wants to join the room
    const cbUserWantsToJoin = (msg) => {
        const {user_id} = msg;
        console.log(user_id);
        setUsersInQueue((prevState) => [...prevState, user_id]);
    }

    // interface - new events received
    const cbNewEvents = (event) => {
        const element = parseEventToElement(event);
        const duplicateElement = allElements.filter( e => e.event_id === element.event_id);
        if (duplicateElement){
            setAllElements( allElements.map( e => event.event_id === e.event_id ? element : e ) );
        }else {
            setAllElements((prevState) => [...prevState, element]);
        }
    }

    // interface - events removed
    const cbRemoveEvent = (event_id) => {
        setAllElements( allElements.filter( e => e.event_id !== event_id ) );
    }

    // canvas - user approve or deny
    const onUserApprovalHandler = (userId, approved) => {
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

    // canvas - leave room button handler
    const onEndRoomHandler = () => {
        serverInterface.leaveRoom().then(() => {
            console.log("user exited room");
            setMessage("Exited.");
        })
    }

    // canvas - new element created
    const onNewElementCreation = (element) => {
        setAllElements((prevState) => [...prevState, element]);
    }

    // canvas - element updated
    const onElementUpdate = element => {
        setAllElements( allElements.map( e => e.event_id === element.event_id ? element : e ) );
    }

    // canvas - remove element
    const onElementRemove = event_id => {
        setAllElements( allElements.filter( e => e.event_id !== event_id ) );
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
                cbUserWantsToJoin,
                cbNewEvents,
                cbRemoveEvent,
                cbNewEvents
            );
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
                    serverInterface={serverInterface}
                    queuedUsers={usersInQueue}
                    elements = {allElements}
                    onUserApprovalHandler={onUserApprovalHandler}
                    onEndRoomHandler={onEndRoomHandler}
                    onNewElementCreation = {onNewElementCreation}
                    onElementUpdate = {onElementUpdate}
                    cbElementRemove = {onElementRemove}
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
