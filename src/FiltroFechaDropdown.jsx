import React, { useState, useRef, useEffect } from "react";

export default function FiltroFechaDropdown({
  opciones, // Array de { value, label }
  value,
  onChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const refDropdown = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (refDropdown.current && !refDropdown.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const currentLabel =
    opciones.find((opt) => opt.value === value)?.label ?? "Filtrar por...";

  return (
    <div ref={refDropdown} style={{ position: "relative", width: 180 }}>
      <button
        type="button"
        className="border rounded-lg px-2 py-2 w-full text-left bg-white shadow"
        style={{ minHeight: 36 }}
        onClick={() => setIsOpen((v) => !v)}
      >
        {currentLabel}
        <span className="float-right">&#9662;</span>
      </button>
      {isOpen && (
        <div
          className="absolute z-50 bg-white rounded-xl border shadow-lg mt-2"
          style={{
            left: 0,
            width: "100%",
            maxHeight: 300, // ~10 opciones * alto de cada div
            overflowY: "auto",
          }}
        >
          {opciones.map((opt) => (
            <div
              key={opt.value}
              className={
                "py-2 px-3 cursor-pointer hover:bg-blue-100 text-xs md:text-base " +
                (value === opt.value ? "bg-blue-200 font-semibold" : "")
              }
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}