import React from "react";

export default function Swatch({ isHost, setToolType, undoAction, downloadCanvas, userLeftRoom, leaveRoom, message }) {

  if (userLeftRoom){
    return (
        <div>
          <br />
          <br />
          {message} <br />
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


            {
              isHost ?
                  <button title="End Room" onClick={() => { leaveRoom(); }}>
                    End Room
                  </button> :
                  <button title="Leave Room" onClick={() => { leaveRoom(); }}>
                    Leave Room
                  </button>
            }



          </div>
        </div>
      </div>
    </div>
  );
}
