import React from "react";

export default function Swatch({ setToolType, undoAction, downloadCanvas, userLeftRoom, leaveRoom }) {

  if (userLeftRoom){
    return (
        <div>
          <br />
          <br />
          You are no longer in the room. <br />
          <button title="Download this canvas as Image" onClick={() => { downloadCanvas(); }}>
            Download as Image
          </button>
        </div>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <div>
            <button title="Pencil" onClick={() => { setToolType("pencil"); }}>
              Pencil
            </button>

            <button title="Image" onClick={() => { setToolType("image"); }}>
              Upload Image
            </button>

            <button title="Sticky Note" onClick={() => { setToolType("sticky-note"); }}>
              Sticky Note
            </button>

            <button title="Erase" onClick={() => { setToolType("erase"); }}>
              Erase
            </button>

            <button title="Select" onClick={() => { setToolType("selection"); }}>
              Select
            </button>


            <button title="Undo" onClick={() => { undoAction(); }}>
              Undo
            </button>

            <button title="Download as Image" onClick={() => { downloadCanvas(); }}>
              Download as Image
            </button>

            <button title="Leave Room" onClick={() => { leaveRoom(); }}>
              Leave Room
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
