import React from "react";

const Button = ({ children, onClick, size = "base", className = "", ...props }) => {
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    base: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg"
  };

  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 text-white rounded hover:bg-blue-700 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
