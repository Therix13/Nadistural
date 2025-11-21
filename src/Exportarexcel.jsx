import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function Exportarexcel({ pedidos, tienda }) {
  const [showPopup, setShowPopup] = useState(false);
  const [fecha, setFecha] = useState("");
  const exportToExcel = () => {
    if (!fecha) {
      alert("Por favor selecciona una fecha.");
      return;
    }
    const pedidosFiltrados = pedidos.filter(p => p.fecha === fecha);
    if (pedidosFiltrados.length === 0) {
      alert("No hay pedidos para la fecha seleccionada.");
      return;
    }
    const data = pedidosFiltrados.map(pedido => ({
      Cliente: pedido.nombre,
      Dirección: [pedido.calleNumero, pedido.colonia, pedido.municipio, pedido.codigoPostal].filter(Boolean).join(", "),
      "Entre calles": pedido.entreCalles,
      Teléfono: pedido.telefono,
      Productos: pedido.productos
        ? pedido.productos.map(p => `${p.cantidad}x ${p.producto}`).join(", ")
        : "",
      Precio: pedido.precio,
      Nota: pedido.nota,
      Fecha: pedido.fecha,
      Vendedor: pedido.vendedor,
      Estado: pedido.estado
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
    const nombreArchivo = `Pedidos_${tienda}_${fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    setShowPopup(false);
    setFecha("");
  };
  return (
    <>
      <button
        className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
        onClick={() => setShowPopup(true)}
      >
        Exportar
      </button>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div
            className="absolute inset-0"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center animate-fadein">
            <h2 className="text-lg font-bold mb-4">Exportar pedidos a Excel</h2>
            <label className="w-full text-left font-medium mb-2">Selecciona la fecha:</label>
            <input
              type="date"
              value={fecha}
              className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm mb-4"
              onChange={(e) => setFecha(e.target.value)}
            />
            <div className="flex gap-4 mt-2 w-full justify-end">
              <button
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
                onClick={() => setShowPopup(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
                onClick={exportToExcel}
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}