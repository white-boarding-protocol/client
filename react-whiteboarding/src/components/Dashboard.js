import React from "react";
import {useState} from "react";

export default function Dashboard( {joinBtnHandler, createBtnHandler, displayForm, message} ){

    const [text, setText] = useState("");

    const joinRoom = () => {
        joinBtnHandler(text);
        setText("");
    }

    let messageComponent = (message && message !== "") ? <div> Message: {message}</div> : <div />;

    let formComponent = <div>
        <input name="room_id" type="text" value={text} placeholder="Enter Room Id"
               onChange={ (event) => {setText(event.target.value);} }
        /><br />
        <button onClick={joinRoom}> Join Room </button><br />
        <button onClick={createBtnHandler}> Create Room </button><br />
    </div>

    return (
        <div>
            {messageComponent}
            {displayForm ? formComponent: <div /> }
        </div>
    );
}