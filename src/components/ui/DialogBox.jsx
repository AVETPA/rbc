import React from "react";
import ReactDOM from "react-dom";

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg relative">
        <Button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
        >
          &times;
        </Button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
