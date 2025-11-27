import React, { useState, useRef, useEffect } from "react";

function canEditDeleteConfirm(estado, isAdmin, metodoPago) {
  if (isAdmin) return true;
  if (estado === "pendiente" || estado === "reagendar" || estado === undefined || estado === "") return true;
  if (estado === "confirmado" && metodoPago === "Pendiente") return true;
  return false;
}

function getPedidoColorClass(pedido) {
  if (pedido.estado === "confirmado" && pedido.metodoPago === "Efectivo")
    return "bg-green-700 text-white";
  if (pedido.estado === "confirmado" && pedido.metodoPago === "Transferencia")
    return "bg-blue-700 text-white";
  if (pedido.estado === "confirmado" && pedido.metodoPago === "Pendiente")
    return "bg-yellow-500 text-black";
  if (pedido.estado === "confirmado" && pedido.metodoPago === "Cancelado")
    return "bg-red-700 text-white";
  return "";
}

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
  const currentLabel = opciones.find((opt) => opt.value === value)?.label ?? "Filtrar por...";
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
  const nuevos = pedidos
    .filter(p => p.estado === "" || p.estado === undefined)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateA - dateB;
    });
  const otros = pedidos
    .filter(p => p.estado !== "" && p.estado !== undefined)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return [...nuevos, ...otros];
}

const campos = [
  { key: 'nombre', label: 'Cliente' },
  { key: 'calleNumero', label: 'Calle y número' },
  { key: 'colonia', label: 'Colonia' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'codigoPostal', label: 'Código Postal' },
  { key: 'entreCalles', label: 'Entre calles' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'productos', label: 'Productos' },
  { key: 'precio', label: 'Precio' },
  { key: 'nota', label: 'Nota' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'vendedor', label: 'Vendedor' }
];

function PedidoDetalleModalMobile({
  pedido,
  open,
  onClose,
  canEditDeleteConfirm,
  onEdit,
  onDelete,
  onConfirm,
  isAdmin,
  isAnyPopupOpen,
  hideClose
}) {
  if (!pedido || !open) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[95vw] max-w-md max-h-screen overflow-y-auto relative pt-20 sm:pt-10">
        <div className="flex space-x-6 items-center justify-center mt-6 mb-4">
          <button
            className="bg-gray-200 hover:bg-gray-300 rounded-full p-3 flex items-center justify-center sm:hidden"
            aria-label="Regresar"
            onClick={onClose}
            style={{ minWidth: 48, minHeight: 48 }}
          >
            <svg className="h-7 w-7 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          {canEditDeleteConfirm(pedido.estado, isAdmin, pedido.metodoPago) && (
            <>
              <button
                title="Editar"
                className="bg-blue-100 hover:bg-blue-200 transition rounded-full p-3"
                onClick={() => { onEdit(pedido.id); onClose(); }}
                disabled={isAnyPopupOpen}
              >
                <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L7.5 21H3v-4.5L16.732 3.732z"/>
                </svg>
              </button>
              <button
                title="Eliminar"
                className="bg-red-100 hover:bg-red-200 transition rounded-full p-3"
                onClick={() => { onDelete(pedido.id); onClose(); }}
                disabled={isAnyPopupOpen}
              >
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <button
                title="Confirmar"
                className="bg-green-100 hover:bg-green-200 transition rounded-full p-3"
                onClick={() => { onConfirm(pedido.id); onClose(); }}
                disabled={isAnyPopupOpen}
              >
                <svg className="w-9 h-9 text-green-600 transition" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="text-left space-y-2">
          <div><span className="font-semibold">Cliente:</span> {pedido.nombre}</div>
          <div><span className="font-semibold">Calle y número:</span> {pedido.calleNumero}</div>
          <div><span className="font-semibold">Colonia:</span> {pedido.colonia}</div>
          <div><span className="font-semibold">Municipio:</span> {pedido.municipio}</div>
          <div><span className="font-semibold">Código Postal:</span> {pedido.codigoPostal}</div>
          <div><span className="font-semibold">Entre calles:</span> {pedido.entreCalles}</div>
          <div><span className="font-semibold">Teléfono:</span> {pedido.telefono}</div>
          <div><span className="font-semibold">Productos:</span> {Array.isArray(pedido.productos)
            ? pedido.productos.map((p, ix) => (
                <span key={ix}>
                  <span className="font-semibold">{p.cantidad}</span>{" "}
                  <span>{p.producto}</span>
                  {ix < pedido.productos.length - 1 ? ", " : ""}
                </span>
              ))
            : pedido.productos}
          </div>
          <div><span className="font-semibold">Precio:</span> {pedido.precio}</div>
          <div><span className="font-semibold">Nota:</span> {pedido.nota}</div>
          <div><span className="font-semibold">Fecha:</span> {pedido.fecha}</div>
          <div><span className="font-semibold">Vendedor:</span> {pedido.vendedor}</div>
        </div>
      </div>
    </div>
  );
}

export default function PedidosTable({
  pedidos,
  pedidoAEditar,
  handleEditarPedido,
  handleEliminarPedido,
  onShowPopupConfirmar,
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
  const [deletePopupPedidoId, setDeletePopupPedidoId] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const mostrarAccionEliminar = (pedido) => (
    <button
      title="Eliminar"
      className="focus:outline-none group"
      onClick={() => setDeletePopupPedidoId(pedido.id)}
      disabled={isAnyPopupOpen}
    >
      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  );

  const handleEliminarPedidoConfirmado = (id) => {
    setDeletePopupPedidoId(null);
    handleEliminarPedido(id);
  };

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
        className="flex items-center justify-between w-full"
        style={{
          width: "100%",
          padding: "0 32px 24px 32px",
        }}
      >
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Día anterior"
            className="rounded-full transition hover:bg-gray-200 p-2"
            onClick={() => {
              if (!filtroFecha) return;
              if (/^\d{4}-\d{2}-\d{2}$/.test(filtroFecha)) {
                const d = new Date(filtroFecha);
                d.setDate(d.getDate() - 1);
                setFiltroFecha(d.toISOString().slice(0, 10));
              }
            }}
            disabled={!filtroFecha || !/^\d{4}-\d{2}-\d{2}$/.test(filtroFecha)}
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            aria-label="Día siguiente"
            className="rounded-full transition hover:bg-gray-200 p-2"
            onClick={() => {
              if (!filtroFecha) return;
              if (/^\d{4}-\d{2}-\d{2}$/.test(filtroFecha)) {
                const d = new Date(filtroFecha);
                d.setDate(d.getDate() + 1);
                setFiltroFecha(d.toISOString().slice(0, 10));
              }
            }}
            disabled={!filtroFecha || !/^\d{4}-\d{2}-\d{2}$/.test(filtroFecha)}
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="w-full">
        <div className="hidden sm:block">
          <table className="w-full rounded-xl bg-white" style={{ fontSize: "clamp(11px, 1.2vw, 1rem)" }}>
            <thead>
              <tr className="bg-blue-50">
                {campos.map(campo =>
                  <th key={campo.key} className="px-2 py-2 font-bold text-slate-700 text-left whitespace-nowrap">{campo.label}</th>
                )}
                <th className="px-2 py-2 text-center align-middle whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosOrdenados.length ? (
                pedidosOrdenados.map((pedido, i) => {
                  const alternaFila =
                    i % 2 === 0
                      ? { background: "#fff" }
                      : { background: "linear-gradient(90deg, #f6f7f9 0%, #e5e7eb 100%)" };
                  const tdClass = getPedidoColorClass(pedido);
                  return (
                    <React.Fragment key={pedido.id || i}>
                      <tr style={alternaFila}>
                        {campos.map(campo => (
                          <td
                            key={campo.key}
                            className={`px-2 py-2 text-left align-top ${tdClass}`}
                            style={{ whiteSpace: "normal" }}
                            title={pedido[campo.key]?.toString() || ""}
                          >
                            {campo.key === "productos"
                              ? (Array.isArray(pedido.productos)
                                ? pedido.productos.map((p, ix) => (
                                    <span key={ix}>
                                      <span className="font-semibold">{p.cantidad}</span>{" "}
                                      <span>{p.producto}</span>
                                      {ix < pedido.productos.length - 1 ? ", " : ""}
                                    </span>
                                  ))
                                : pedido.productos)
                              : pedido[campo.key]}
                          </td>
                        ))}
                        <td className={`px-2 py-2 text-center align-middle ${tdClass}`}>
                          <div className="flex justify-center items-center gap-1 md:gap-2">
                            {canEditDeleteConfirm(pedido.estado, isAdmin, pedido.metodoPago) && (
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
                                {mostrarAccionEliminar(pedido)}
                                <button
                                  title="Confirmar"
                                  className="focus:outline-none group"
                                  onClick={() => onShowPopupConfirmar(pedido.id)}
                                  disabled={isAnyPopupOpen}
                                >
                                  <svg className="w-6 h-6 rounded-full text-green-700 transition bg-green-100 hover:bg-green-200 p-1 shadow" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={campos.length+1} style={{
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
                  <td className="px-2 py-2 text-left align-top" colSpan={campos.length+1}>
                    No hay pedidos que mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden">
          {pedidosOrdenados.length ? (
            pedidosOrdenados.map((pedido, i) => {
              const bg = getPedidoColorClass(pedido) || "bg-white";
              return (
                <div
                  key={pedido.id || i}
                  className={`mb-3 rounded-lg shadow ${bg} p-4 cursor-pointer transition`}
                  onClick={() => setDetalle(pedido)}
                >
                  <div className="flex flex-col">
                    <div className="font-semibold text-lg">{pedido.nombre}</div>
                    <div className="text-gray-600">{pedido.telefono}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs px-2 py-4">No hay pedidos que mostrar</div>
          )}
        </div>
      </div>
      {deletePopupPedidoId && (
        <div className="fixed z-40 inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
            <div className="mb-4 text-lg font-bold text-black">¿Estás seguro que deseas eliminar este pedido?</div>
            <div className="flex gap-6 mt-4 justify-center">
              <button
                className="rounded-full p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 transition text-xl font-bold"
                onClick={() => setDeletePopupPedidoId(null)}
              >
                No
              </button>
              <button
                className="rounded-full p-4 bg-[#ec004c] hover:bg-[#c8003e] text-white transition text-xl font-bold flex items-center"
                onClick={() => handleEliminarPedidoConfirmado(deletePopupPedidoId)}
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}
      {detalle && (
        <PedidoDetalleModalMobile
          pedido={detalle}
          open={!!detalle}
          onClose={() => setDetalle(null)}
          canEditDeleteConfirm={canEditDeleteConfirm}
          onEdit={handleEditarPedido}
          onDelete={handleEliminarPedido}
          onConfirm={onShowPopupConfirmar}
          isAdmin={isAdmin}
          isAnyPopupOpen={isAnyPopupOpen}
          hideClose={false}
        />
      )}
    </div>
  );
}