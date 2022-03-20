import React from "react";

export default function Swatch({ setToolType, undoAction, downloadCanvas }) {
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

          </div>
        </div>
      </div>
    </div>
  );
}
