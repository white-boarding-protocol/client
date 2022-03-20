import rough from "roughjs/bundled/rough.esm";
const gen = rough.generator();

function createElement(id, x1, y1, x2, y2, type, extras) {
  const roughEle = gen.line(x1, y1, x2, y2);
  if (type === "image" ){
    y1 = y1 - 30; // for some reason, elements are created at extra +30 y offset. this hacky fix is to mitigate that.
    x2 = x1 + 150;
    y2 = y1 + 150;
  }else if (type === "note"){
    y1 = y1 - 20; // for some reason, elements are created at extra +20 y offset. this hacky fix is to mitigate that.
    x2 = x1 + 20;
    y2 = y1 + 50;
  }
  return { id, x1, y1, x2, y2, roughEle, type, extras };
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

export {createElement, midPointBtw, adjustElementCoordinates, uploadImage, downloadCanvas, clearCircle, showEraser}