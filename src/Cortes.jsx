import React from "react";

export default function Cortes({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-8 z-110 w-[92vw] max-w-sm flex flex-col items-center">
        <h3 className="text-lg font-bold mb-4">Cortes</h3>
        <div className="mb-6 text-center text-gray-700">
          Aquí va el contenido del módulo Cortes.
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-green-600 text-white font-semibold"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}