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

function ZoomModal({ open, onClose, children, hideClose }) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) setVisible(true);
    else if (visible) {
      setClosing(true);
      const timeout = setTimeout(() => {
        setClosing(false);
        setVisible(false);
      }, 220);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!visible) return null;
  return (
    <div
      className="fixed z-30 inset-0 flex items-center justify-center bg-black/30 transition-all"
      aria-modal
      role="dialog"
      onClick={() => { if (!closing) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 w-[95vw] max-w-md max-h-screen overflow-y-auto relative
          ${open && !closing ? "scale-100 opacity-100 animate-zoomIn"
            : closing ? "animate-zoomOut" : "scale-95 opacity-0"}
          transition-all duration-300`}
        onClick={e => e.stopPropagation()}
        style={{ animationDuration: "220ms" }}
      >
        {children}
        {!hideClose && (
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-900"
          onClick={() => { if (!closing) onClose(); }}
        >
          <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        )}
      </div>
      <style>
        {`
        @keyframes zoomIn {
          0% {transform: scale(0.8);opacity:0;}
          100% {transform: scale(1);opacity:1;}
        }
        @keyframes zoomOut {
          0% {transform: scale(1);opacity:1;}
          100% {transform: scale(0.8);opacity:0;}
        }
        .animate-zoomIn{animation: zoomIn 0.22s cubic-bezier(.36,.54,.37,1.12);}
        .animate-zoomOut{animation: zoomOut 0.22s cubic-bezier(.36,.54,.37,1.12);}
        `}
      </style>
    </div>
  );
}

function PedidoDetalleModalMobile({ pedido, open, onClose, canEditDeleteConfirm, onEdit, onConfirm, onDelete, isAdmin, isAnyPopupOpen, hideClose }) {
  if (!pedido) return null;
  return (
    <ZoomModal open={open} onClose={onClose} hideClose={hideClose}>
      <div className="text-left space-y-2">
        <div><span className="font-semibold">Cliente:</span> {pedido.nombre}</div>
        <div><span className="font-semibold">Calle y número:</span> {pedido.calleNumero}</div>
        <div><span className="font-semibold">Colonia:</span> {pedido.colonia}</div>
        <div><span className="font-semibold">Municipio:</span> {pedido.municipio}</div>
        <div><span className="font-semibold">Código Postal:</span> {pedido.codigoPostal}</div>
        <div><span className="font-semibold">Entre calles:</span> {pedido.entreCalles}</div>
        <div><span className="font-semibold">Teléfono:</span> {pedido.telefono}</div>
        <div><span className="font-semibold">Productos:</span>{" "}
          {Array.isArray(pedido.productos)
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
      <div className="flex space-x-6 items-center justify-center mt-6">
        {canEditDeleteConfirm(pedido.estado, isAdmin) && (
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
              onClick={() => onDelete(pedido.id)}
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
    </ZoomModal>
  );
}

function ConfirmarEliminarModal({ open, onClose, onConfirm }) {
  return (
    <ZoomModal open={open} onClose={onClose} hideClose={true}>
      <div className="flex flex-col items-center justify-center min-w-[220px]">
        <div className="font-bold text-lg text-center mb-2 text-black">¿Estas seguro que deseas eliminar este pedido?</div>
        <div className="flex gap-6 mt-4 justify-center">
          <button
            className="rounded-full p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 transition text-xl font-bold"
            onClick={onClose}
          >
            No
          </button>
          <button
            className="rounded-full p-4 bg-[#ec004c] hover:bg-[#c8003e] text-white transition text-xl font-bold flex items-center"
            onClick={onConfirm}
          >
            Sí
          </button>
        </div>
      </div>
    </ZoomModal>
  );
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
  const [detalle, setDetalle] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [deletePopupPedidoId, setDeletePopupPedidoId] = useState(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mostrarAccionEliminar = (pedido) => {
    return (
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
  };

  const handleEliminarPedidoConfirmado = (id) => {
    setDeletePopupPedidoId(null);
    setDetalle(null);
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

      <PedidoDetalleModalMobile
        pedido={detalle}
        open={!!detalle}
        onClose={() => setDetalle(null)}
        canEditDeleteConfirm={canEditDeleteConfirm}
        onEdit={handleEditarPedido}
        onDelete={(id) => setDeletePopupPedidoId(id)}
        onConfirm={handleConfirmarPedido}
        isAdmin={isAdmin}
        isAnyPopupOpen={isAnyPopupOpen}
        hideClose={!!deletePopupPedidoId}
      />

      <ConfirmarEliminarModal
        open={!!deletePopupPedidoId}
        onClose={() => setDeletePopupPedidoId(null)}
        onConfirm={() => handleEliminarPedidoConfirmado(deletePopupPedidoId)}
      />

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
                                {mostrarAccionEliminar(pedido)}
                                <button
                                  title="Confirmar"
                                  className="focus:outline-none group"
                                  onClick={() => handleConfirmarPedido(pedido.id)}
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
              let bg =
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
                  : "bg-white";
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
    </div>
  );
}