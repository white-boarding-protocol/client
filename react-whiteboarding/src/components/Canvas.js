import React, { useState, useEffect } from "react";

import EventAction from "../constants";
import { isEqual, omit } from "lodash";
import Swatch from "./swatch";
import rough from "roughjs/bundled/rough.esm";

import {
    createElement,
    midPointBtw,
    adjustElementCoordinates,
    uploadImage,
    downloadCanvas,
    clearCircle,
    showEraser} from "./canvasServiceUtils";

const gen = rough.generator();

/**
 * Canvas componenet - to be integrated by bipin
 * @param serverInterface instance of interface.js
 * @param allEvents all the events that the server sent once room is loaded
 * @param queuedUsers all the users that are waiting in the queue
 * @param onUserApproval callback function to be called when user is approved or denied
 */
export default function Canvas(
    {roomId, serverConnection, queuedUsers, onUserApproval, cbEndRoom}
){

    const [elements, setElements] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);

    const [points, setPoints] = useState([]);
    const [path, setPath] = useState([]);

    const [action, setAction] = useState("none");
    const [toolType, setToolType] = useState("pencil");
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedToDragElement, setSelectedToDragElement] = useState(null);

    if (queuedUsers.length >= 1){
        const user = queuedUsers.pop();
        let allow = window.confirm("User "+ user + " wants to join. Approve?");
        onUserApproval(user, allow);
    }

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";

        context.save();

        const drawpath = () => {
            path.forEach((stroke, index) => {
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
            });
        };

        const roughCanvas = rough.canvas(canvas);

        if (path !== undefined) drawpath();


        elements.forEach(({ id, x1, y1, x2, y2, roughEle, type, extras }) => {
            context.globalAlpha = "1";
            if (type === null) {
                roughCanvas.draw(roughEle);
            }else if ( type === "image" ){
                if (extras !== null) {
                    var img = new Image();
                    img.onload = function() {
                        context.drawImage(img, x1, y1, x2-x1, y2-y1);
                        context.beginPath();
                        context.stroke();
                    };
                    img.src = extras
                }
            }else if ( type === "note" ){
                context.font = '20px serif';
                context.fillText( extras, x1, y1)
            }else if (type === "pencil"){
                //todo: implement
                console.log("to be implemented")
            }
        })

        serverConnection.setMessageHandler(onMessageHandler);

        return () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [elements, path]);


    const onMessageHandler = (receivedElement) => {
        const {uuid} = receivedElement;

        switch (receivedElement.action){

            case EventAction.CREATE:
            case EventAction.EDIT:
                const duplicateElement = elements.filter( e =>
                    e.uuid === uuid ||
                    isEqual(omit(receivedElement, ['uuid', 'id']), omit(e, ['uuid', 'id']))
                )
                if ( duplicateElement) {
                    receivedElement.id = duplicateElement.id;
                    updateElementsStateArray(duplicateElement);
                    return;
                }
                setElements((prevState) => [...prevState, receivedElement]);
                break;

            case EventAction.REMOVE:
                const itemToErase = elements.filter( e =>
                    e.uuid === uuid ||
                    isEqual(omit(receivedElement, ['uuid', 'id']), omit(e, ['uuid', 'id']))
                )
                setElements( elements.filter( e => e.id !== itemToErase.id ) )
                break;
        }
    }


    const updateElement = (index, x1, y1, x2, y2, toolType) => {
        const updatedElement = createElement(index, x1, y1, x2, y2, toolType);
        const elementsCopy = [...elements];
        elementsCopy[index] = updatedElement;
        setElements(elementsCopy);
        serverConnection.updateElement(updatedElement);
    };

    const handleMouseDown = (e) => {
        console.log(toolType);
        const { clientX, clientY } = e;
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        const id = elements.length; // todo: generate element id properly

        switch (toolType){
            case "pencil":
                setAction("sketching");
                setIsDrawing(true);
                const transparency = "1.0";
                const newEle = { clientX, clientY, transparency, };
                setPoints((state) => [...state, newEle]);
                context.lineCap = 5;
                context.moveTo(clientX, clientY);
                context.beginPath();
                break;

            case "line":
                setAction("drawing");
                const element = createElement(id, clientX, clientY, clientX, clientY);
                setElements((prevState) => [...prevState, element]);
                setSelectedElement(element);
                console.log(elements);
                break;

            case "image":
                setAction("uploading-image");
                uploadImage( (base64EncImage) => {
                    const imgEnc = 'data:image/gif;base64,'+base64EncImage;
                    const imgElem = createElement( elements.length, clientX, clientY, null, null, "image", imgEnc)
                    setElements((prevState) => [...prevState, imgElem]);
                    serverConnection.postElement(imgElem)
                });
                break;

            case "erase":
                setAction("erasing");
                const itemToErase = fetchSelectedElement(clientX, clientY, elements)
                if (itemToErase !== null){
                    setElements( elements.filter( e => e.id !== itemToErase.id ) )
                    serverConnection.remove(itemToErase)
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
                }else{ // this is just a normal sticky not
                    // ask for note data to enter.
                    var noteData = prompt("Enter the note data.")
                    if (noteData === null || noteData === "") return
                    // sticky note element
                    const stickyNoteElem = createElement( elements.length, clientX, clientY, null, null, "note", noteData)
                    setElements((prevState) => [...prevState, stickyNoteElem]);
                    serverConnection.postElement(stickyNoteElem);
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
        const { clientX, clientY } = e;

        if (toolType === "erase"){
            //showEraser(clientX, clientY, 20);
        }

        switch (action){

            case "sketching": // pencil tool
                if (!isDrawing) return;
                const transparency = points[points.length - 1].transparency;
                const newEle = { clientX, clientY, transparency };
                setPoints((state) => [...state, newEle]);
                var midPoint = midPointBtw(clientX, clientY);
                context.quadraticCurveTo(clientX, clientY, midPoint.x, midPoint.y);
                context.lineTo(clientX, clientY);
                context.stroke();
                break;

            case "drawing": // line tool
                const index = elements.length - 1;
                const { x1, y1 } = elements[index];
                updateElement(index, x1, y1, clientX, clientY, toolType);
                break;

            case "selection":
                if (selectedElement !== null){
                    const {id, x1, y1, type, extras} = selectedElement
                    if (type === "image" || type === "note"){
                        setSelectedToDragElement(selectedElement);
                        if ( Math.abs(clientX-x1) <= 20 && Math.abs(clientY-y1) <= 20 ){
                            return;
                        }
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
        const { clientX, clientY } = e;

        switch (action){

            case "sketching": // pencil tool

                context.closePath();
                const element = points;
                setPoints([]);
                setPath((prevState) => [...prevState, element]); //tuple
                setIsDrawing(false);
                break;

            case "drawing": // line tool
                const index = selectedElement.id;
                const { id, type, strokeWidth } = elements[index];
                const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
                updateElement(id, x1, y1, x2, y2, type, strokeWidth);
                break;

            case "erasing":
                setAction(null);
                break;

            case "selection":

                if (selectedToDragElement !== null){
                    const {id, type, extras} = selectedToDragElement
                    if (type === "image" || type === "note"){
                        const updatedElement = createElement(id, clientX, clientY, clientX, clientY, type, extras );
                        const elementsCopy = [...elements];
                        elementsCopy[id] = updatedElement;
                        setElements(elementsCopy);
                        serverConnection.updateElement(updatedElement);
                    }
                }else if (action === "selection"){
                    const selectedItem = fetchSelectedElement(clientX, clientY, elements);
                    console.log(selectedItem)
                    if (selectedItem !== null && selectedItem.type === "note"){
                        var noteData = prompt("Update note data:", selectedItem.extras)
                        if (noteData === null) return
                        selectedItem.extras = noteData
                        const elementsCopy = [...elements];
                        elementsCopy[selectedItem.id] = selectedItem;
                        setElements(elementsCopy);
                        serverConnection.updateElement(selectedItem);
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
            updateElementsStateArray(imageElement)
        };
        image.src = imageElement.extras;
    }

    const handleDoubleClick = (e) => {
        const { clientX, clientY } = e;

    }

    const fetchSelectedElement = (clickX, clickY, elements, filterType = null) => {
        for(let i = elements.length - 1; i >= 0; i--){
            const element = elements[i];
            const { x1, y1, x2, y2, type } = element;
            if ( clickX >= x1 && clickX <= x2 && clickY >=y1 && clickY <= y2 ){
                if ( filterType === null || filterType === type)
                    return element;
            }
        }
        return null;
    }


    const updateElementsStateArray = (updatedElement) => {
        const elementsCopy = [...elements];
        elementsCopy[updatedElement.id] = updatedElement;
        setElements(elementsCopy);
    }

    return (
        <div>
            Room Id: {roomId} <br/>
            <div>
                <Swatch
                    setToolType={setToolType}
                    undoAction={() => serverConnection.postUndo()}
                    downloadCanvas={downloadCanvas}
                />
            </div>
            <canvas id="canvas" className="App"
                    width={window.innerWidth} height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
            > Canvas </canvas>
        </div>
    );
}