import React, { useState } from "react";
import * as XLSX from "xlsx";

function fechaMananaLocalString() {
  const ahora = new Date();
  const manana = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1
  );
  const yyyy = manana.getFullYear();
  const mm = String(manana.getMonth() + 1).padStart(2, "0");
  const dd = String(manana.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Exportarexcel({ pedidos, tienda }) {
  const [showPopup, setShowPopup] = useState(false);
  const [fecha, setFecha] = useState("");

  const abrirPopup = () => {
    setFecha(fechaMananaLocalString());
    setShowPopup(true);
  };

  const exportToExcel = () => {
    if (!fecha) {
      alert("Por favor selecciona una fecha.");
      return;
    }
    const pedidosFiltrados = pedidos.filter((p) => p.fecha === fecha);
    if (pedidosFiltrados.length === 0) {
      alert("No hay pedidos para la fecha seleccionada.");
      return;
    }
    const data = pedidosFiltrados.map((pedido) => ({
      Cliente: pedido.nombre,
      "Calle y Número": pedido.calleNumero,
      Colonia: pedido.colonia,
      Municipio: pedido.municipio,
      "Código Postal": pedido.codigoPostal,
      "Entre calles": pedido.entreCalles,
      Teléfono: pedido.telefono,
      Productos: pedido.productos
        ? pedido.productos.map((p) => `${p.cantidad}x ${p.producto}`).join(", ")
        : "",
      Precio: pedido.precio,
      Nota: pedido.nota,
      Fecha: pedido.fecha
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);

    const cols = Object.keys(data[0] || {});
    worksheet["!cols"] = cols.map((key, i) => {
      let maxLen = key.length;
      for (let j = 0; j < data.length; j++) {
        const val = data[j][key];
        if (val && val.toString().length > maxLen) maxLen = val.toString().length;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 15), 80) };
    });

    for (let i = 0; i < cols.length; i++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true }
        };
      }
    }

    for (let r = 1; r <= data.length; r++) {
      for (let c = 0; c < cols.length; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: r, c: c })];
        if (cell && cell.v !== undefined) {
          cell.s = {
            alignment: { wrapText: true }
          };
        }
      }
    }

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
        onClick={abrirPopup}
      >
        Exportar
      </button>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="absolute inset-0" onClick={() => setShowPopup(false)} />
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