import React, { useState, useRef, useEffect } from "react";

function FiltroFechaDropdown({ opciones, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const refDropdown = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (refDropdown.current && !refDropdown.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
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
            maxHeight: 300,
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

function sortPedidosByFechaAndEstado(pedidos) {
  const estadosFinales = ["pendiente", "cancelado"];
  return [...pedidos].sort((a, b) => {
    const aFinal = estadosFinales.includes(a.estado);
    const bFinal = estadosFinales.includes(b.estado);
    if (!aFinal && !bFinal) {
      return new Date(b.fecha) - new Date(a.fecha);
    }
    if (aFinal && !bFinal) return 1;
    if (!aFinal && bFinal) return -1;
    return new Date(b.fecha) - new Date(a.fecha);
  });
}

export default function PedidosTable({
  pedidos,
  pedidoAEditar,
  canEditDeleteConfirm,
  handleEditarPedido,
  handleEliminarPedido,
  handleConfirmarPedido,
  isAdmin,
  isAnyPopupOpen,
  fechasUnicas,
  filtroFecha,
  setFiltroFecha,
  ExportComponent
}) {
  const opcionesFiltro = [
    { value: "ninguna", label: "Ninguna" },
    { value: "", label: "Todas" },
    { value: "pendientes", label: "Pendientes" },
    { value: "cancelado", label: "Cancelados" },
    ...fechasUnicas.map((fecha) => ({ value: fecha, label: fecha })),
  ];

  const pedidosOrdenados = sortPedidosByFechaAndEstado(pedidos);

  return (
    <div
      className="PedidosTableContainer w-full"
      style={{
        position: "relative",
        width: "100%",
        marginBottom: 22,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.09)",
        display: "flex",
        flexDirection: "column",
        padding: "32px 0 0 0"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "0 32px 24px 32px",
        }}
      >
        <div style={{ minWidth: 200, display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          <FiltroFechaDropdown
            opciones={opcionesFiltro}
            value={filtroFecha}
            onChange={setFiltroFecha}
          />
          <button
            type="button"
            onClick={() => setFiltroFecha("ninguna")}
            className="px-3 py-2 bg-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-300 transition text-xs md:text-base"
            style={{ height: 40 }}
          >
            Limpiar
          </button>
        </div>
        <div>{ExportComponent}</div>
      </div>

      <div className="w-full overflow-x-auto" style={{ borderRadius: 16 }}>
        <table
          className="w-full rounded-xl bg-white"
          style={{
            minWidth: 900,
            fontSize: "clamp(11px, 2vw, 1rem)"
          }}
        >
          <thead>
            <tr className="bg-blue-50">
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Cliente</th>
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Calle y número</th>
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Colonia</th>
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Municipio</th>
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Código Postal</th>
              <th className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">Entre calles</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Teléfono</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Productos</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Precio</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Nota</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Fecha</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Vendedor</th>
              <th className="px-2 py-2 text-center align-middle whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosOrdenados.length ? (
              pedidosOrdenados.map((pedido, i) => {
                let colorNombre = "";
                if (pedido.estado === "reagendar") colorNombre = "bg-gray-400 text-gray-900 font-bold rounded px-1";
                const alternaFila =
                  i % 2 === 0
                    ? { background: "#fff" }
                    : { background: "linear-gradient(90deg, #f6f7f9 0%, #e5e7eb 100%)" };
                const tdClass =
                  pedido.estado === "efectivo"
                    ? "bg-green-600 text-black"
                    : pedido.estado === "transferencia"
                    ? "bg-blue-600 text-white"
                    : pedido.estado === "pendiente"
                    ? "bg-yellow-500 text-black"
                    : pedido.estado === "cancelado"
                    ? "bg-red-600 text-white"
                    : pedido.estado === "reagendar"
                    ? "bg-gray-400 text-gray-900"
                    : "";

                return (
                  <React.Fragment key={pedido.id || i}>
                    <tr style={alternaFila}>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.nombre || ""}>
                        <span className={colorNombre}>{pedido.nombre || ""}</span>
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.calleNumero || ""}>
                        {pedido.calleNumero || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.colonia || ""}>
                        {pedido.colonia || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.municipio || ""}>
                        {pedido.municipio || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.codigoPostal || ""}>
                        {pedido.codigoPostal || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.entreCalles || ""}>
                        {pedido.entreCalles || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.telefono || ""}>
                        {pedido.telefono || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.productos?.map(p => `${p.cantidad} ${p.producto}`).join(", ")}>
                        {pedido.productos?.map((p, ix) => (
                          <span key={ix}>
                            <span className="font-semibold">{p.cantidad}</span>{" "}
                            <span>{p.producto}</span>
                            {ix < pedido.productos.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.precio || ""}>
                        {pedido.precio || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.nota || ""}>
                        {pedido.nota || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.fecha || ""}>
                        {pedido.fecha || ""}
                      </td>
                      <td className={`px-2 py-2 text-left align-top ${tdClass} whitespace-nowrap`} title={pedido.vendedor || ""}>
                        {pedido.vendedor || ""}
                      </td>
                      <td className={`px-2 py-2 text-center align-middle ${tdClass} whitespace-nowrap`}>
                        <div className="flex justify-center items-center gap-1 md:gap-2">
                          {canEditDeleteConfirm(pedido.estado, isAdmin) && (
                            <>
                              <button
                                title="Editar"
                                className="focus:outline-none group"
                                onClick={() => handleEditarPedido(pedido.id)}
                                disabled={isAnyPopupOpen}
                              >
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L7.5 21H3v-4.5L16.732 3.732z"/>
                                </svg>
                              </button>
                              <button
                                title="Eliminar"
                                className="focus:outline-none group"
                                onClick={() => handleEliminarPedido(pedido.id)}
                                disabled={isAnyPopupOpen}
                              >
                                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                              <button
                                title="Confirmar"
                                className="focus:outline-none group"
                                onClick={() => handleConfirmarPedido(pedido.id)}
                                disabled={isAnyPopupOpen}
                              >
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13} style={{
                        height: "2px",
                        background: "#222",
                        border: "none",
                        padding: 0,
                        margin: 0
                      }}></td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td className="px-2 py-2 text-left align-top" colSpan={13}>
                  No hay pedidos que mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}