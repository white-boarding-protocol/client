import './App.css';
import React from "react";
import {useState, useEffect} from "react";

import Canvas from "./components/Canvas";
import Interface from "./interface/interface";
import {v4 as uuidv4} from 'uuid';
import Dashboard from "./components/Dashboard";
import {parseEventToElement} from "./components/canvasServiceUtils";


let serverInterface = null;

function App( ) {

    const [currentUserId, setCurrentUserId] = useState("user_"+uuidv4());
    const [connectServer, setConnectServer] = useState(true);
    const [showCanvas, setShowCanvas] = useState(false);
    const [displayForm, setDisplayForm] = useState(true);
    const [message, setMessage] = useState("");
    const [usersInQueue, setUsersInQueue] = useState([]);
    const [allElements, setAllElements] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [roomEnded, setRoomEnded] = useState(false);

    const [deletedEventIds, setDeletedEventIds] = useState([]);

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
             setIsHost(true);
         }).catch((msg) => {
             setMessage("Error creating room, " + msg);
             console.log(msg)
         })

    }

    // interface - socket closed
    const cbSocketHasBeenClosed = () => {
        console.log("socket has been closed");
        setMessage("Socket closed.");
        setConnectServer(true);
        setShowCanvas(false);
        setDisplayForm(false);
    }

    // interface - join request approved or denied
    const cbApprovalRequest = (approved, message) => {
        const {events} = message;
        if (approved){
            events.forEach( e => onNewElementCreation( parseEventToElement(e) ) );
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

    // interface - events received
    const cbWhiteboardEvent = (event) => {
        console.log(event)
        switch (event.type) {
            case 1: // room events
                if (event.room_event_type === 3) { // host ended room
                    setRoomEnded(true);
                }else if (event.room_event_type === 2){ // specific user left the room
                    // user id = event.user_id;
                    // yet to implement
                }
                break;
            case 6:
                setDeletedEventIds(prevState => [...prevState, event.last_event_id])
                break;
            default:
                break;
        }
        if (event.event_id === null){
            return;
        }
        const element = parseEventToElement(event);
        switch (event.action){
            case 0: // create
                onElementEditOrUpdate(element);
                break;
            case 1: // edit
                onElementEditOrUpdate(element);
                break;
            case 2: // delete
                onElementRemoval(element.event_id);
                break;
            default:
                break;
        }
    }

    const onElementEditOrUpdate = (element) => {
       setAllElements((prevState) => [...prevState, element]);
    }

    const onElementRemoval = (event_id) => {
        setDeletedEventIds( (prevState => [...prevState, event_id] ) )
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

    // canvas - remove element
    const onElementRemove = event_id => {
        setAllElements( allElements.filter( e => e.event_id !== event_id ) );
    }

    useEffect(() => {
        if (connectServer || serverInterface === null){
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
                cbWhiteboardEvent
            );
            serverInterface.connect().then(msg => {
                console.log("Connected to server.");
            }).catch(err => {
                console.log(err);
            })
            setConnectServer(false);
        }
    })

    const map1 = new Map();
    allElements.forEach( e => {
        if ( e !== null && e.event_id !== null && !deletedEventIds.includes(e.event_id) ){
            const existingVal = map1.get(e.event_id);
            if(existingVal && e.type === "image") {
                e.extras = existingVal.extras;
            }
            map1.set(e.event_id, e);
        }
    })

    return (
    <div className="App">
        {
            showCanvas ?
                <Canvas
                    roomId={serverInterface.roomId}
                    userId={currentUserId}
                    isHost = {isHost}
                    roomEnded = {roomEnded}
                    serverInterface={serverInterface}
                    queuedUsers={usersInQueue}
                    elements = { Array.from(map1.values()) }
                    onUserApprovalHandler={onUserApprovalHandler}
                    onEndRoomHandler={onEndRoomHandler}
                    onNewElementCreation = {onNewElementCreation}
                    onElementUpdate = {onElementEditOrUpdate}
                    onElementRemove = {onElementRemove}
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
