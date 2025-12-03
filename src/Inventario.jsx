import React, { useEffect, useState } from "react";
import { getFirestore, collection, setDoc, doc, getDocs, deleteDoc, updateDoc, increment, addDoc, getDoc } from "firebase/firestore";

export default function Inventario({ open, onClose, tienda, user, onAlertaProducto }) {
  const [zoom, setZoom] = useState(open);
  const [productos, setProductos] = useState([]);
  const [showCampos, setShowCampos] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');
  const [alertaCantidad, setAlertaCantidad] = useState('');
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [alertaProductosTriggers, setAlertaProductosTriggers] = useState([]);
  const [paqEmpresa, setPaqEmpresa] = useState('');
  const [paqCodigo, setPaqCodigo] = useState('');
  const [showPaqueteriaGlobal, setShowPaqueteriaGlobal] = useState(false);
  const [paqItems, setPaqItems] = useState([{ productoId: "", cantidad: "" }]);

  useEffect(() => {
    if (open) setZoom(true);
    else if (zoom) {
      const timeout = setTimeout(() => setZoom(false), 220);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (open && tienda?.name) {
      cargarProductos();
      setShowCampos(false);
      setNuevoNombre('');
      setNuevaCantidad('');
      setModoEdicion(null);
      setEditCantidad('');
      setAlertaCantidad('');
      setPaqEmpresa('');
      setPaqCodigo('');
      setShowPaqueteriaGlobal(false);
      setPaqItems([{ productoId: "", cantidad: "" }]);
    }
  }, [open, tienda]);

  function getDismissKey() {
    const usernameKey = typeof user === "string" ? user : (user?.nombre ?? "anon");
    return `alerta_dismissed_${usernameKey}_${tienda?.name ?? "global"}`;
  }

  async function cargarProductos() {
    if (!tienda?.name) return;
    const db = getFirestore();
    const productosRef = collection(db, "Inventario", tienda.name, "PRODUCTOS");
    const snap = await getDocs(productosRef);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setProductos(docs);
    const triggers = docs.filter(d => d.alerta !== undefined && d.alerta !== null && Number(d.cantidad) < Number(d.alerta));
    const dismissKey = getDismissKey();
    const dismissed = typeof sessionStorage !== "undefined" && sessionStorage.getItem(dismissKey);
    if (!dismissed && triggers.length > 0) {
      setAlertaProductosTriggers(triggers);
      setShowAlertaModal(true);
      if (typeof onAlertaProducto === "function") {
        triggers.forEach(t => onAlertaProducto(t, tienda));
      }
    } else {
      setAlertaProductosTriggers([]);
      setShowAlertaModal(false);
    }
  }

  async function handleAgregarProducto(e) {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevaCantidad.trim()) return;
    setGuardando(true);
    try {
      const db = getFirestore();
      const productoRef = doc(db, "Inventario", tienda.name, "PRODUCTOS", nuevoNombre.trim());
      await setDoc(productoRef, {
        nombre: nuevoNombre.trim(),
        cantidad: Number(nuevaCantidad.trim()),
        alerta: null,
        paqueteria: null
      });
      setNuevoNombre('');
      setNuevaCantidad('');
      setShowCampos(false);
      await cargarProductos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarCantidad() {
    if (!modoEdicion?.producto || editCantidad === "") return;
    setGuardando(true);
    try {
      const db = getFirestore();
      const productoRef = doc(db, "Inventario", tienda.name, "PRODUCTOS", modoEdicion.producto.id);
      await updateDoc(productoRef, { cantidad: Number(editCantidad) });
      setModoEdicion(null);
      setEditCantidad('');
      await cargarProductos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarProducto() {
    if (!modoEdicion?.producto) return;
    setGuardando(true);
    try {
      const db = getFirestore();
      const productoRef = doc(db, "Inventario", tienda.name, "PRODUCTOS", modoEdicion.producto.id);
      await deleteDoc(productoRef);
      setModoEdicion(null);
      await cargarProductos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarAlerta() {
    if (!modoEdicion?.producto) return;
    setGuardando(true);
    try {
      const db = getFirestore();
      const productoRef = doc(db, "Inventario", tienda.name, "PRODUCTOS", modoEdicion.producto.id);
      if (alertaCantidad === "" || alertaCantidad === null) {
        await updateDoc(productoRef, { alerta: null });
      } else {
        await updateDoc(productoRef, { alerta: Number(alertaCantidad) });
      }
      setModoEdicion(null);
      setAlertaCantidad('');
      await cargarProductos();
    } finally {
      setGuardando(false);
    }
  }

  function addPaqRow() {
    setPaqItems(prev => [...prev, { productoId: productos[0]?.id ?? "", cantidad: "" }]);
  }

  function removePaqRow(index) {
    setPaqItems(prev => prev.filter((_, i) => i !== index));
  }

  function updatePaqRow(index, key, value) {
    setPaqItems(prev => prev.map((r, i) => i === index ? { ...r, [key]: value } : r));
  }

  async function handleGuardarPaqueteriaGlobal() {
    const validItems = paqItems
      .map(i => ({ productoId: i.productoId, cantidad: Number(i.cantidad) || 0 }))
      .filter(i => i.productoId && i.cantidad > 0);
    if (validItems.length === 0) return;
    const byProduct = validItems.reduce((acc, cur) => {
      acc[cur.productoId] = (acc[cur.productoId] || 0) + cur.cantidad;
      return acc;
    }, {});
    setGuardando(true);
    try {
      const db = getFirestore();
      const paqPayload = (paqEmpresa.trim() === "" && paqCodigo.trim() === "") ? null : { empresa: paqEmpresa.trim(), codigo: paqCodigo.trim() };
      const actor = typeof user === "string" ? user : (user?.nombre ?? "unknown");
      const updates = Object.entries(byProduct).map(async ([productoId, qty]) => {
        const productoRef = doc(db, "Inventario", tienda.name, "PRODUCTOS", productoId);
        const prodSnapBefore = await getDoc(productoRef);
        const prodName = prodSnapBefore.exists() ? (prodSnapBefore.data().nombre ?? productoId) : productoId;
        const payload = paqPayload ? { cantidad: increment(qty), paqueteria: paqPayload } : { cantidad: increment(qty) };
        await updateDoc(productoRef, payload);
        await addDoc(collection(db, "Inventario", tienda.name, "MOVIMIENTOS"), {
          productoId,
          productoNombre: prodName,
          cantidad: qty,
          tipo: "paqueteria",
          empresa: paqPayload?.empresa ?? null,
          codigo: paqPayload?.codigo ?? null,
          usuario: actor,
          confirmado: false,
          timestamp: new Date().toISOString(),
          fechaPedido: new Date().toISOString().slice(0, 10)
        });
      });
      await Promise.all(updates);
      setPaqEmpresa('');
      setPaqCodigo('');
      setPaqItems([{ productoId: productos[0]?.id ?? "", cantidad: "" }]);
      setShowPaqueteriaGlobal(false);
      await cargarProductos();
    } finally {
      setGuardando(false);
    }
  }

  function handleCerrarAlerta() {
    setShowAlertaModal(false);
    setAlertaProductosTriggers([]);
  }

  function handleNoMostrarMas() {
    const dismissKey = getDismissKey();
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(dismissKey, "1");
    } catch (e) {}
    handleCerrarAlerta();
  }

  if (!zoom) return null;
  const isAdmin = user?.rol === "admin";

  return (
    <div className="fixed z-50 inset-0 flex items-start sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 1 }} onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl p-2 sm:p-6 w-full sm:max-w-md mx-auto sm:my-10 my-0 flex flex-col min-h-[355px]`}
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '96vh',
          marginTop: 'max(60px, 6vh)',
          marginBottom: 'max(16px, 3vh)',
          zIndex: 2,
          animationDuration: "220ms"
        }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-900"
          onClick={onClose}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">
          {tienda?.name ? `Inventario de ${tienda.name}` : "Inventario"}
        </h3>
        {!modoEdicion && (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
              {isAdmin && (
                <button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-all duration-150 text-sm"
                  onClick={() => setShowCampos(v => !v)}
                  disabled={guardando}
                >
                  Agregar Productos
                </button>
              )}
              <button
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-all duration-150 text-sm"
                onClick={() => {
                  setShowPaqueteriaGlobal(v => !v);
                  if (paqItems.length === 0) setPaqItems([{ productoId: productos[0]?.id ?? "", cantidad: "" }]);
                }}
                disabled={guardando}
              >
                Agregar Paquetería
              </button>
            </div>
            {showCampos && (
              <form className="w-full flex flex-col gap-2 mb-3 items-center justify-center" onSubmit={handleAgregarProducto}>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full text-xs sm:text-sm"
                  placeholder="Nombre"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  disabled={guardando}
                  autoFocus
                />
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg px-3 py-2 w-full text-xs sm:text-sm"
                  placeholder="Cantidad"
                  value={nuevaCantidad}
                  onChange={e => setNuevaCantidad(e.target.value)}
                  disabled={guardando}
                />
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    className="bg-gray-200 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-bold shadow w-1/2 text-xs sm:text-base"
                    onClick={() => {
                      setShowCampos(false);
                      setNuevoNombre('');
                      setNuevaCantidad('');
                    }}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow w-1/2 text-xs sm:text-base"
                    disabled={guardando || !nuevoNombre.trim() || !nuevaCantidad.trim()}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
            {showPaqueteriaGlobal && (
              <div className="w-full mb-4 p-2 sm:p-4 bg-gray-50 rounded-lg border">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Productos y cantidades</label>
                <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                  {paqItems.map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-stretch">
                      <select
                        className="flex-1 border rounded-lg px-3 py-2 text-xs sm:text-sm"
                        value={row.productoId}
                        onChange={e => updatePaqRow(idx, "productoId", e.target.value)}
                      >
                        <option value="">Seleccione producto</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        className="w-full sm:w-32 border rounded-lg px-3 py-2 text-xs sm:text-sm"
                        placeholder="Cantidad"
                        value={row.cantidad}
                        onChange={e => updatePaqRow(idx, "cantidad", e.target.value)}
                      />
                      <button
                        type="button"
                        className="flex-shrink-0 px-3 py-2 bg-gray-200 rounded-lg text-slate-800 text-base"
                        onClick={() => removePaqRow(idx)}
                        disabled={paqItems.length === 1 || guardando}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex mb-3">
                  <button type="button" className="flex-1 bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm px-3 py-2 rounded-lg" onClick={addPaqRow}>Añadir fila</button>
                </div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Empresa de paquetería</label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full mb-3 text-xs sm:text-sm"
                  placeholder="Ej. DHL"
                  value={paqEmpresa}
                  onChange={e => setPaqEmpresa(e.target.value)}
                  disabled={guardando}
                />
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Código / Tracking</label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full mb-3 text-xs sm:text-sm"
                  placeholder="Ej. AWB123456"
                  value={paqCodigo}
                  onChange={e => setPaqCodigo(e.target.value)}
                  disabled={guardando}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex-1 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold text-xs sm:text-base"
                    onClick={() => { setShowPaqueteriaGlobal(false); setPaqEmpresa(''); setPaqCodigo(''); setPaqItems([{ productoId: productos[0]?.id ?? "", cantidad: "" }]); }}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-base"
                    onClick={handleGuardarPaqueteriaGlobal}
                    disabled={guardando || paqItems.every(r => !r.productoId || !(Number(r.cantidad) > 0))}
                  >
                    Guardar paquetería
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {isAdmin && modoEdicion && (
          <div className="my-3 p-3 bg-gray-50 rounded-lg border">
            <h4 className="font-bold mb-2 text-center">{modoEdicion.producto.nombre}</h4>
            {modoEdicion.accion === "menu" && (
              <div className="flex flex-col gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
                  onClick={() => {
                    setModoEdicion({ ...modoEdicion, accion: "editar" });
                    setEditCantidad(modoEdicion.producto.cantidad || "");
                  }}
                  disabled={guardando}
                >
                  Editar
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                  onClick={() => setModoEdicion({ ...modoEdicion, accion: "eliminar" })}
                  disabled={guardando}
                >
                  Eliminar
                </button>
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-bold"
                  onClick={() => {
                    setAlertaCantidad(modoEdicion.producto.alerta ?? "");
                    setModoEdicion({ ...modoEdicion, accion: "alerta" });
                  }}
                  disabled={guardando}
                >
                  Alerta
                </button>
                <button
                  className="text-sm underline text-gray-500 hover:text-gray-800 mt-1"
                  onClick={() => setModoEdicion(null)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            )}
            {modoEdicion.accion === "editar" && (
              <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleGuardarCantidad(); }}>
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Cantidad"
                  value={editCantidad}
                  onChange={e => setEditCantidad(e.target.value)}
                  disabled={guardando}
                  autoFocus
                />
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    className="bg-gray-200 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-bold shadow w-1/2"
                    onClick={() => setModoEdicion({ ...modoEdicion, accion: "menu" })}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow w-1/2"
                    type="submit"
                    disabled={guardando || !editCantidad}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
            {modoEdicion.accion === "eliminar" && (
              <div className="flex flex-col gap-3 items-center">
                <div className="text-center text-sm text-gray-700 mb-1">
                  ¿Seguro que deseas <span className="font-bold text-red-600">eliminar</span> este producto?
                </div>
                <div className="flex w-full gap-2">
                  <button
                    className="bg-gray-200 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-bold shadow w-1/2"
                    onClick={() => setModoEdicion({ ...modoEdicion, accion: "menu" })}
                  >
                    Cancelar
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow w-1/2"
                    onClick={handleEliminarProducto}
                    disabled={guardando}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
            {modoEdicion.accion === "alerta" && (
              <div className="flex flex-col items-center gap-4 p-2">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a programar</label>
                  <input
                    type="number"
                    min="0"
                    className="border rounded-lg px-3 py-2 w-full"
                    placeholder="Ej. 10"
                    value={alertaCantidad}
                    onChange={e => setAlertaCantidad(e.target.value)}
                    disabled={guardando}
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    className="flex-1 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold"
                    onClick={() => setModoEdicion({ ...modoEdicion, accion: "menu" })}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold"
                    onClick={handleGuardarAlerta}
                    disabled={guardando || alertaCantidad === ""}
                  >
                    Guardar alerta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col flex-1 h-fit min-h-[120px] mt-2">
          <h4 className="font-semibold mb-2 text-gray-700 text-sm sm:text-base">Productos:</h4>
          <div
            className="overflow-y-auto scrollbar-thin pr-1"
            style={{
              minHeight: "130px",
              maxHeight: "37vh"
            }}
          >
            <ul className="space-y-2">
              {productos.length === 0 && (
                <li className="text-gray-400 text-sm px-2">No hay productos registrados.</li>
              )}
              {productos.map(p => {
                const isBelow = p.alerta !== undefined && p.alerta !== null && Number(p.cantidad) < Number(p.alerta);
                return (
                  <li
                    key={p.id}
                    className={`bg-gray-100 rounded px-3 py-2 text-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between transition ${isAdmin ? "cursor-pointer hover:bg-blue-50" : ""}`}
                    onClick={() =>
                      isAdmin
                        ? setModoEdicion({ producto: p, accion: "menu" })
                        : null
                    }
                  >
                    <div className="flex-1">
                      <div className="font-medium">{p.nombre}</div>
                      {isBelow && (
                        <div className="text-xs text-red-600 mt-1">
                          Alarma: Por debajo de {p.alerta}
                        </div>
                      )}
                    </div>
                    {p.cantidad !== undefined && (
                      <div className="mt-2 sm:mt-0">
                        <span className="ml-4 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {p.cantidad}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {showAlertaModal && alertaProductosTriggers.length > 0 && (
        <div className="fixed z-60 inset-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="bg-white rounded-2xl p-6 z-20 max-w-2xl w-[94vw] mx-4">
            <h3 className="text-lg font-bold mb-4">Alertas de Inventario</h3>
            <div className="grid gap-4 max-h-64 overflow-y-auto mb-4 grid-cols-1 md:grid-cols-2">
              {alertaProductosTriggers.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 bg-gray-50"
                  style={{
                    border: "1px solid rgba(0,0,0,0.06)",
                    background: "#f7f8f9",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
                  }}
                >
                  <div className="font-semibold text-gray-800 mb-1">{item.nombre}</div>
                  <div className="text-sm text-gray-700">Stock actual: <span className="font-semibold">{item.cantidad}</span></div>
                  <div className="text-sm text-gray-700">Umbral programado: <span className="font-semibold">{item.alerta}</span></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-full shadow text-center"
                onClick={handleNoMostrarMas}
              >
                No mostrar de nuevo (hasta iniciar sesión)
              </button>
              <button
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold px-5 py-2 rounded-lg shadow-sm"
                onClick={handleCerrarAlerta}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
        @keyframes zoomIn {
          0% {transform: scale(0.85);opacity:0;}
          100% {transform: scale(1);opacity:1;}
        }
        @keyframes zoomOut {
          0% {transform: scale(1);opacity:1;}
          100% {transform: scale(0.85);opacity:0;}
        }
        .animate-zoomIn{animation: zoomIn 0.22s cubic-bezier(.36,.54,.37,1.12);}
        .animate-zoomOut{animation: zoomOut 0.22s cubic-bezier(.36,.54,.37,1.12);}
        `}
      </style>
    </div>
  );
}