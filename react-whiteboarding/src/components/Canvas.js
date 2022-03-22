import React, { useState, useEffect } from "react";

import Swatch from "./swatch";
import rough from "roughjs/bundled/rough.esm";

import {
    createElement,
    midPointBtw,
    uploadImage,
    downloadCanvas,
    clearCircle
} from "./canvasServiceUtils";


/**
 * Canvas componenet - to be integrated by bipin
 * @param serverInterface instance of interface.js
 * @param allEvents all the events that the server sent once room is loaded
 * @param queuedUsers all the users that are waiting in the queue
 * @param onUserApproval callback function to be called when user is approved or denied
 */
export default function Canvas(
    {   roomId, userId, isHost, roomEnded,
        serverInterface,
        queuedUsers, elements,
        onUserApprovalHandler, onEndRoomHandler, onNewElementCreation, onElementUpdate, onElementRemove
    }
){

    const [isDrawing, setIsDrawing] = useState(false);

    const [points, setPoints] = useState([]);
    const [path, setPath] = useState([]);

    const [action, setAction] = useState("none");
    const [toolType, setToolType] = useState("pencil");
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedToDragElement, setSelectedToDragElement] = useState(null);

    const [userLeftRoom, setLeftRoom] = useState(false);

    if (queuedUsers.length >= 1){
        const user = queuedUsers.pop();
        let allow = window.confirm("User "+ user + " wants to join. Approve?");
        onUserApprovalHandler(user, allow);
    }

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";

        context.save();

        console.log(elements);

        const drawpath = (stroke) => {
            context.beginPath();

            stroke.forEach((point, i) => {
                var midPoint = midPointBtw(point.clientX, point.clientY);

                context.quadraticCurveTo(
                    point.clientX,
                    point.clientY,
                    midPoint.x,
                    midPoint.y
                );
                context.lineTo(point.clientX, point.clientY);
                context.stroke();
            });
            context.closePath();
            context.save();
        };

        elements.forEach((elem) => {
            const { x1, y1, x2, y2, roughEle, type, extras } = elem;
            context.globalAlpha = "1";
            if (type === null) {
                roughCanvas.draw(roughEle);
            }else if ( type === "image" ){
                if (extras !== null) {
                    var img = new Image();
                    img.onload = function() {
                        context.drawImage(img, x1, y1, x2, y2);
                        context.beginPath();
                        context.stroke();
                    };
                    img.src = extras;
                }
            }else if ( type === "note" ){
                context.font = '20px serif';
                context.fillText( extras, x1, y1)
            }else if (type === "pencil"){
                const stroke = []
                elem.extras.map( point =>
                    stroke.push( {clientX: point[0], clientY: point[1], transparency: "1"} )
                )
                drawpath(stroke);
            }
        })

        const roughCanvas = rough.canvas(canvas);

        return () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [elements, path]);



    const handleMouseDown = (e) => {
        console.log(toolType);
        let { clientX, clientY } = e;
        clientY = clientY - 50;
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");

        switch (toolType){
            case "pencil":
                setAction("sketching");
                setIsDrawing(true);
                const transparency = "1.0";
                const newPoint = { clientX, clientY, transparency, };
                setPoints((state) => [...state, newPoint]);
                context.lineCap = 5;
                context.moveTo(clientX, clientY);
                context.beginPath();
                break;

            case "image":
                setAction("uploading-image");
                uploadImage( (base64EncImage) => {
                    const imgEnc = 'data:image/gif;base64,'+base64EncImage;
                    const imgElem = createElement( elements.length, clientX, clientY, null, null, "image", imgEnc)
                    const {x1, x2, y1, y2} = imgElem;
                    serverInterface.addImage(x1, y1, imgEnc, y2, x2).then( msg => {
                        imgElem.event_id = msg.event.event_id;
                        onNewElementCreation(imgElem);
                    } ).catch( err => {
                        console.log(err);
                    })
                });
                break;

            case "erase":
                setAction("erasing");
                const itemToErase = fetchSelectedElement(clientX, clientY, elements)
                if (itemToErase !== null){
                    onElementRemove(itemToErase.event_id);
                    switch (itemToErase.type){
                        case "image":
                            serverInterface.removeImage(itemToErase.event_id);
                            break;
                        case "note":
                            serverInterface.removeStickNote(itemToErase.event_id);
                            break;
                        case "pencil":
                            serverInterface.removeDraw(itemToErase.event_id);
                            break;
                        default:
                            break;
                    }
                }
                break;

            case "sticky-note":
                setAction("posting-note");
                context.moveTo(clientX, clientY);
                // check if there is an image, in that case, it will be a comment.
                const underlyingImg = fetchSelectedElement(clientX, clientY, elements, "image");
                if (underlyingImg !== null){ // this is a comment on the image
                    var commentData = prompt("Enter comment for this image")
                    addTextComment(underlyingImg, commentData, clientX, clientY);
                }else{ // this is just a normal sticky note
                    // ask for note data to enter.
                    var noteData = prompt("Enter the note data.")
                    if (noteData === null || noteData === "") return
                    // sticky note element
                    const stickyNoteElem = createElement( elements.length, clientX, clientY, null, null, "note", noteData);
                    serverInterface.addStickNote(noteData, clientX, clientY).then( msg => {
                        stickyNoteElem.event_id = msg.event.event_id;
                        onNewElementCreation(stickyNoteElem);
                    } ).catch( err => {
                        console.error(err);
                    })

                }
                break;

            case 'selection':
                setAction("selection");
                const selectedItem = fetchSelectedElement(clientX, clientY, elements)
                if (selectedItem !== null){
                    setSelectedElement(selectedItem);
                    setSelectedToDragElement(null);
                }
                break;

            default:
                break;
        }

    };

    const handleMouseMove = (e) => {

        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        let { clientX, clientY } = e;
        clientY = clientY - 50;

        if (toolType === "erase"){
            //showEraser(clientX, clientY, 20);
        }

        switch (action){

            case "sketching": // pencil tool
                if (!isDrawing) return;
                const transparency = points[points.length - 1].transparency;
                const newPoint = { clientX, clientY, transparency };
                setPoints((state) => [...state, newPoint]);
                var midPoint = midPointBtw(clientX, clientY);
                context.quadraticCurveTo(clientX, clientY, midPoint.x, midPoint.y);
                context.lineTo(clientX, clientY);
                context.stroke();
                break;

            case "selection":
                if (selectedElement !== null){
                    const {type} = selectedElement
                    if (type === "image" || type === "note"){
                        setSelectedToDragElement(selectedElement);
                    }
                }
                break;

            case "erasing":
                clearCircle(context, clientX, clientY, 20);
                //todo: call server
                break;

            default:
                break;

        }

    };

    const handleMouseUp = (e) => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        let { clientX, clientY } = e;
        clientY = clientY - 50;
        switch (action){

            case "sketching": // pencil tool
                context.closePath();
                const listOfPoints = points.map( p => [p.clientX, p.clientY] );
                serverInterface.draw(listOfPoints, null, null, null).then(msg => {
                    const strokeElem = createElement( msg.event.event_id, clientX, clientY, null, null, "pencil", listOfPoints);
                    setPoints([]);
                    setIsDrawing(false);
                    onNewElementCreation(strokeElem);
                }).catch(err => {
                    console.error(err);
                })
                break;

            case "erasing":
                setAction(null);
                break;

            case "selection":
                if (selectedToDragElement !== null){
                    const {event_id, type, extras, x2, y2} = selectedToDragElement
                    if (type === "image" || type === "note"){
                        const updatedElement = createElement(event_id, clientX, clientY, x2, y2, type, extras);
                        onElementUpdate(updatedElement);
                        switch (type){
                            case "note":
                                serverInterface.editStickNote(event_id, extras, clientX, clientY);
                                break;
                            case "image":
                                serverInterface.editImage(event_id, clientX, clientY, y2, x2).then(msg => {
                                    console.log(msg)
                                }).catch(err => {
                                    console.error(err)
                                })
                                break;
                        }
                    }
                }else if (action === "selection"){
                    const selectedItem = fetchSelectedElement(clientX, clientY, elements);
                    if (selectedItem !== null && selectedItem.type === "note"){
                        const noteData = prompt("Update note data:", selectedItem.extras)
                        selectedItem.extras = noteData
                        onElementUpdate(selectedItem);
                        serverInterface.editStickNote(selectedItem.event_id, noteData, clientX, clientY);
                    }else if (selectedItem !== null && selectedItem.type === "image"){
                        const comment = prompt("Add comment to this image: ")
                        if (comment !== null && comment !== "" ) {
                            serverInterface.addComment(comment, selectedItem.event_id);
                        }
                    }
                }
                setSelectedToDragElement(null);
                setSelectedElement(null);
                break;

            default:
                break;

        }
        setSelectedToDragElement(null);

    };

    const addTextComment = (imageElement, commentText, x, y) => {
        const canvas = document.getElementById('canvas');
        var newCanvas = canvas.cloneNode(true);
        const image = new Image();
        image.onload = function() {
            newCanvas.width = image.width;
            newCanvas.height = image.height;
            const context = newCanvas.getContext('2d');
            var hRatio = newCanvas.width  / image.width    ;
            var vRatio =  newCanvas.height / image.height  ;
            var ratio  = Math.min ( hRatio, vRatio );
            var centerShift_x = ( newCanvas.width - image.width*ratio ) / 2;
            var centerShift_y = ( newCanvas.height - image.height*ratio ) / 2;
            context.clearRect(0,0,newCanvas.width, newCanvas.height);
            context.drawImage(image, 0,0, image.width, image.height,
                centerShift_x,centerShift_y,image.width*ratio, image.height*ratio);

            context.font = '20px serif';
            context.fillText( commentText, x, y)

            imageElement.extras = newCanvas.toDataURL()
            onElementUpdate(imageElement);
        };
        image.src = imageElement.extras;
    }

    const fetchSelectedElement = (clickX, clickY, elements, filterType = null) => {
        for(let i = elements.length - 1; i >= 0; i--){
            const element = elements[i];
            const { x1, y1, x2, y2, type } = element;
            if ( clickX >= x1 && clickX <= (x1+x2) && clickY >=y1 && clickY <= (y1+y2) ){
                if ( filterType === null || filterType === type) {
                    return element;
                }
            }
        }
        return null;
    }

    const handleLeaveRoom = () => {
        if (isHost){
            serverInterface.endRoom().then(msg => {
                setLeftRoom(true);
            }).catch(err => {
                console.log(err);
            })
        }else {
            serverInterface.leaveRoom().then(msg => {
                setLeftRoom(true);
            }).catch(err => {
                console.log(err);
            });
        }

    }


    return (
        <div>
            Room Id: {roomId} <br/>
            User Id: {userId} <br/>
            <div>
                <Swatch
                    isHost = {isHost}
                    setToolType={setToolType}
                    undoAction={ () =>
                        serverInterface.undo().then(msg => {
                            onElementRemove(msg.event.last_event_id);
                        }).catch(err => { console.log(err); } )
                    }
                    downloadCanvas={downloadCanvas}
                    userLeftRoom = {userLeftRoom || roomEnded}
                    message = { roomEnded ? "Server ended the room." : "You are no longer in the room." }
                    leaveRoom={ handleLeaveRoom }
                />
            </div>
            <canvas id="canvas" className="App"
                    width={window.innerWidth} height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
            > Canvas </canvas>
        </div>
    );
}