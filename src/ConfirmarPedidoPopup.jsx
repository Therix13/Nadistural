import React from "react";

export default function ConfirmarPedidoPopup({ open, onClose, onAction }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 min-w-[300px] max-w-sm flex flex-col items-center animate-fadein">
        <h3 className="text-xl font-bold mb-4 text-slate-800">Confirmar pedido</h3>
        <p className="mb-6 text-slate-600">Selecciona una acción:</p>
        <div className="flex flex-col gap-3 w-full">
          <button
            className="w-full px-5 py-3 rounded-xl font-bold bg-green-700 text-white shadow-md hover:bg-green-800 transition"
            onClick={() => onAction("confirmado", "Efectivo")}
          >
            Efectivo
          </button>
          <button
            className="w-full px-5 py-3 rounded-xl font-bold bg-blue-700 text-white shadow-md hover:bg-blue-800 transition"
            onClick={() => onAction("confirmado", "Transferencia")}
          >
            Transferencia
          </button>
          <button
            className="w-full px-5 py-3 rounded-xl font-bold bg-yellow-500 text-yellow-900 shadow-md hover:bg-yellow-600 transition"
            onClick={() => onAction("pendiente")}
          >
            Pendiente
          </button>
          <button
            className="w-full px-5 py-3 rounded-xl font-bold bg-gray-400 text-gray-900 shadow-md hover:bg-gray-500 transition"
            onClick={() => onAction("reagendar")}
          >
            Reagendar
          </button>
          <button
            className="w-full px-5 py-3 rounded-xl font-bold bg-red-700 text-white shadow-md hover:bg-red-800 transition"
            onClick={() => onAction("cancelado")}
          >
            Cancelado
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-5 py-2 bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300 font-semibold shadow"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}