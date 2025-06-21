// /src/components/ui/button.jsx
export function Button({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-700 text-white font-semibold py-2 px-4 rounded hover:bg-blue-800 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
