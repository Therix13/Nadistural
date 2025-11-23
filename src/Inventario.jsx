import React, { useEffect, useState } from "react";
import { getFirestore, collection, setDoc, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import PedidoModal from "./PedidoModal";

export default function Inventario({ open, onClose, tienda, user }) {
  const [zoom, setZoom] = useState(open);
  const [productos, setProductos] = useState([]);
  const [showCampos, setShowCampos] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');

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
    }
  }, [open, tienda]);

  async function cargarProductos() {
    if (!tienda?.name) return;
    const db = getFirestore();
    const productosRef = collection(db, "Inventario", tienda.name, "PRODUCTOS");
    const snap = await getDocs(productosRef);
    setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (!modoEdicion?.producto || !editCantidad) return;
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

  if (!zoom) return null;
  const isAdmin = user?.rol === "admin";

  return (
    <div
      className="fixed z-50 inset-0 flex items-center justify-center"
      aria-modal
      role="dialog"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 1 }} />

      <div
        className={`relative bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] min-h-[250px] max-w-lg mx-auto transition-all duration-200 ${
          open ? "scale-100 opacity-100 animate-zoomIn" : "animate-zoomOut"
        }`}
        onClick={e => e.stopPropagation()}
        style={{ zIndex: 2, animationDuration: "220ms" }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-900"
          onClick={onClose}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h3 className="text-xl font-bold mb-5 text-center text-gray-800">
          {tienda?.name ? `Inventario de ${tienda.name}` : "Inventario"}
        </h3>

        {isAdmin && !modoEdicion && (
          <>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-all duration-150 mb-4"
              onClick={() => setShowCampos(v => !v)}
              disabled={guardando}
            >
              Agregar Productos
            </button>
            {showCampos && (
              <form className="w-full flex flex-col gap-2 mb-2 items-center justify-center" onSubmit={handleAgregarProducto}>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Nombre"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  disabled={guardando}
                  autoFocus
                />
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Cantidad"
                  value={nuevaCantidad}
                  onChange={e => setNuevaCantidad(e.target.value)}
                  disabled={guardando}
                />
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    className="bg-gray-200 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-bold shadow w-1/2"
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
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow w-1/2"
                    disabled={guardando || !nuevoNombre.trim() || !nuevaCantidad.trim()}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {isAdmin && modoEdicion && (
          <div className="my-3 p-2 bg-gray-50 rounded-lg border">
            <h4 className="font-bold mb-1 text-center">{modoEdicion.producto.nombre}</h4>
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
                  className="text-sm underline text-gray-500 hover:text-gray-800 mt-1"
                  onClick={() => setModoEdicion(null)}
                  disabled={guardando}
                >Cancelar</button>
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
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2 text-gray-700">Productos:</h4>
          <ul className="space-y-2">
            {productos.length === 0 && (
              <li className="text-gray-400 text-sm">No hay productos registrados.</li>
            )}
            {productos.map(p => (
              <li
                key={p.id}
                className={`bg-gray-100 rounded px-3 py-1 text-gray-800 flex items-center justify-between transition ${
                  isAdmin ? "cursor-pointer hover:bg-blue-50" : ""
                }`}
                onClick={() =>
                  isAdmin
                    ? setModoEdicion({ producto: p, accion: "menu" })
                    : null
                }
              >
                <span className="font-medium">{p.nombre}</span>
                {p.cantidad && (
                  <span className="ml-4 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {p.cantidad}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
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