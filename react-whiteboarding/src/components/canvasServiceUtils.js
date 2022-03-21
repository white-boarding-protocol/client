import rough from "roughjs/bundled/rough.esm";
const gen = rough.generator();

function createElement(id, x1, y1, x2, y2, type, extras) {
  const roughEle = gen.line(x1, y1, x2, y2);
  if (type === "image" ){
    x2 = 150;
    y2 = 150;
  }else if (type === "note"){
    x2 = x1 + 20;
    y2 = y1 + 50;
  }
  return { event_id: id, id, x1, y1, x2, y2, roughEle, type, extras };
}

const midPointBtw = (p1, p2) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
};

const adjustElementCoordinates = (element) => {
  const { type, x1, y1, x2, y2 } = element;
  if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return { x1, y1, x2, y2 };
  } else {
    return { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
};

const uploadImage = ( uponUploadSuccessful ) => {
  let base64String = "";
  var input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    var file = e.target.files[0];
    //var file = document.querySelector('input[type=file]')['files'][0];
    var reader = new FileReader();
    reader.onload = function () {
      base64String = reader.result.replace("data:", "").replace(/^.+,/, "");
      uponUploadSuccessful(base64String);
    }
    reader.readAsDataURL(file);
  }
  input.click();
}


const downloadCanvas = () => {
  const canvas = document.getElementById('canvas');
  var newCanvas = canvas.cloneNode(true);
  var ctx = newCanvas.getContext('2d');
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  var link = document.createElement('a');
  link.download = 'canvas.jpeg';
  link.href = newCanvas.toDataURL("image/jpeg");
  link.click();
}


const clearCircle = (context, x, y, radius)  => {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fill();
  context.restore();
};

const showEraser = (x, y, radius) => {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  clearCircle(context, x, y, radius+5)
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, true);
  context.fillStyle = "#FF6A6A";
  context.fill();
  requestAnimationFrame(showEraser)
}


/**
 * parse event json (server) to element json (client)
 */
const parseEventToElement = (event) => {
  const {event_id, x_coordinate, y_coordinate} = event;
  const element = {
    "event_id": event_id,
    "action": event.action,
    "x1": x_coordinate,
    "y1": y_coordinate,
    "x2": x_coordinate,
    "y2": y_coordinate
  };
  switch (event.type){
    case 4: // image
      element.type = "image";
      element.extras = event.data;
      element.y2 = event.height;
      element.x2 = event.width;
      return element;

    case 3: // sticky note
      element.type = "note";
      element.extras = event.text;
      return element;

    case 2: // draw
      element.type = "pencil";
      element.extras = event.coordinates; // [[1,2],[2,3,],[4,5],[],]
      return element;

    case "comment":
      return null;

    default:
      return null;
  }
}

/**
 * parse element json (client) to event json (server)
 */
const parseElementToEvent = (element, action) => {
  const {event_id, x1, y1, type, extras} = element
  const event = {
    "user_id": this.userId,
    "room_id": this.roomId,
    "event_id": event_id,
    "x_coordinate": x1,
    "y_coordinate": y1,
    "action": action
  }
  switch (type){
    case "image": // image
      event.type = 4;
      event.data = extras;
      return event;

    case "note": // sticky note
      event.type = 3;
      event.text = extras;
      return event;

    case "pencil": // draw
      event.type = 2;
      event.color = "black";
      event.tool = "pencil";
      event.width = extras;
      return event;

    case "comment":
      return null;

    default:
      return null;
  }
}

export {createElement, midPointBtw, adjustElementCoordinates, uploadImage, downloadCanvas, clearCircle, showEraser, parseElementToEvent, parseEventToElement}