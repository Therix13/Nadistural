import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, increment, deleteDoc } from "firebase/firestore";
import { getAllStores } from "./firebase";
import Inventario from "./Inventario";

function formatDateDisplay(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

export default function TiendasInventario({ user }) {
  const [stores, setStores] = useState([]);
  const [alertCounts, setAlertCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [openInventario, setOpenInventario] = useState(false);
  const [activeStore, setActiveStore] = useState(null);
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMovimiento, setConfirmMovimiento] = useState(null);
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmQty, setConfirmQty] = useState("");
  const [savingConfirm, setSavingConfirm] = useState(false);
  const [productosInventario, setProductosInventario] = useState([]);
  const [showPaqModal, setShowPaqModal] = useState(false);
  const [paqMovimientos, setPaqMovimientos] = useState([]);
  const [loadingPaqMovs, setLoadingPaqMovs] = useState(false);
  const [paqSelectedDate, setPaqSelectedDate] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, tienda: null, isPaq: false });
  const isAdmin = user?.rol === "admin" || user === "admin";

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const sDocs = await getAllStores();
        const storeNames = sDocs.map(s => (typeof s === "string" ? s : s.name)).filter(Boolean);
        if (!mounted) return;
        setStores(storeNames);
        await updateCounts(storeNames);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function updateCounts(storeNames) {
    const db = getFirestore();
    const results = {};
    await Promise.all(storeNames.map(async (store) => {
      try {
        const ref = collection(db, "Inventario", store, "PRODUCTOS");
        const snap = await getDocs(ref);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const triggers = docs.filter(d => d.alerta !== undefined && d.alerta !== null && Number(d.cantidad) < Number(d.alerta));
        results[store] = triggers.length;
      } catch (e) {
        results[store] = 0;
      }
    }));
    setAlertCounts(results);
  }

  const openStoreInventario = (storeName) => {
    setActiveStore({ name: storeName });
    setOpenInventario(true);
  };

  const closeInventario = () => {
    setOpenInventario(false);
    setActiveStore(null);
    updateCounts(stores);
  };

  async function abrirMovimientos(storeName) {
    setActiveStore({ name: storeName });
    setShowMovimientos(true);
    setMovimientos([]);
    setLoadingMovimientos(true);
    try {
      const db = getFirestore();
      const productosRef = collection(db, "Inventario", storeName, "PRODUCTOS");
      const productosSnap = await getDocs(productosRef);
      setProductosInventario(productosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const ref = collection(db, "Inventario", storeName, "MOVIMIENTOS");
      const snap = await getDocs(ref);
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data(), tienda: storeName }))
        .filter(item => item.tipo !== "paqueteria");
      const ordered = docs.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
      setMovimientos(ordered);
    } catch (e) {
      setMovimientos([]);
      setProductosInventario([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }

  async function abrirPaqueteriasTienda(storeName) {
    setShowPaqModal(true);
    setPaqMovimientos([]);
    setLoadingPaqMovs(true);
    try {
      const db = getFirestore();
      const ref = collection(db, "Inventario", storeName, "MOVIMIENTOS");
      const snap = await getDocs(ref);
      const filtered = snap.docs
        .map(d => ({ id: d.id, tienda: storeName, ...d.data() }))
        .filter(m => m.tipo === "paqueteria");
      const ordered = filtered.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
      setPaqMovimientos(ordered);
    } catch (e) {
      setPaqMovimientos([]);
    } finally {
      setLoadingPaqMovs(false);
    }
  }

  const closeMovimientos = () => {
    setShowMovimientos(false);
    setMovimientos([]);
    setSelectedDate("");
    setProductosInventario([]);
  };

  const closePaqModal = () => {
    setShowPaqModal(false);
    setPaqMovimientos([]);
    setPaqSelectedDate("");
  };

  const filteredMovimientos = selectedDate
    ? movimientos.filter(m => {
        try {
          if (!m.fechaPedido) return false;
          const fecha = (m.fechaPedido.length > 10 ? m.fechaPedido.slice(0,10) : m.fechaPedido);
          return fecha === selectedDate;
        } catch (e) {
          return false;
        }
      })
    : movimientos;

  const filteredPaqMovimientos = paqSelectedDate
    ? paqMovimientos.filter(m => {
        try {
          if (!m.fechaPedido) return false;
          const fecha = (m.fechaPedido.length > 10 ? m.fechaPedido.slice(0,10) : m.fechaPedido);
          return fecha === paqSelectedDate;
        } catch (e) {
          return false;
        }
      })
    : paqMovimientos;

  function resumenMovimientosDelDia() {
    if (!selectedDate || filteredMovimientos.length === 0 || productosInventario.length === 0) return [];
    const ventasPorProducto = {};
    filteredMovimientos.forEach(mov => {
      if (mov.tipo === "venta" && mov.productoId) {
        ventasPorProducto[mov.productoId] = (ventasPorProducto[mov.productoId] || 0) + Number(mov.cantidad || 0);
      }
    });
    return productosInventario.map(prod => {
      const venta = ventasPorProducto[prod.id] || 0;
      const stockFinal = Number(prod.cantidad || 0);
      const stockInicial = stockFinal + venta;
      return {
        nombre: prod.nombre,
        venta,
        stockInicial,
        stockFinal
      };
    });
  }

  function openConfirm(m) {
    setConfirmMovimiento(m);
    const today = new Date().toISOString().split("T")[0];
    setConfirmDate(m.fechaLlegada || today);
    setConfirmQty(String(m.cantidadLlegada ?? m.cantidad ?? ""));
    setConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!confirmMovimiento || !(showMovimientos || showPaqModal)) return;
    if (!confirmDate || confirmQty === "") return;
    setSavingConfirm(true);
    try {
      const db = getFirestore();
      const tiendaName = confirmMovimiento.tienda || activeStore?.name;
      const mvDocRef = doc(db, "Inventario", tiendaName, "MOVIMIENTOS", confirmMovimiento.id);
      const actor = typeof user === "string" ? user : (user?.nombre ?? "unknown");
      const arrivedQty = Number(confirmQty);
      const originalQty = Number(confirmMovimiento.cantidad ?? 0);
      const diff = arrivedQty - originalQty;

      if (diff !== 0 && confirmMovimiento.productoId) {
        const productoRef = doc(db, "Inventario", tiendaName, "PRODUCTOS", confirmMovimiento.productoId);
        const prodSnap = await getDoc(productoRef);
        if (prodSnap.exists()) {
          await updateDoc(productoRef, { cantidad: increment(diff) });
        }
      }

      await updateDoc(mvDocRef, {
        confirmado: true,
        fechaLlegada: confirmDate,
        cantidadLlegada: arrivedQty,
        diferencia: diff,
        confirmadoPor: actor,
        confirmadoTimestamp: new Date().toISOString()
      });

      setMovimientos(prev => prev.map(m => m.id === confirmMovimiento.id ? { ...m, confirmado: true, fechaLlegada: confirmDate, cantidadLlegada: arrivedQty, diferencia: diff, confirmadoPor: actor, confirmadoTimestamp: new Date().toISOString() } : m));
      setPaqMovimientos(prev => prev.map(m => m.id === confirmMovimiento.id ? { ...m, confirmado: true, fechaLlegada: confirmDate, cantidadLlegada: arrivedQty, diferencia: diff, confirmadoPor: actor, confirmadoTimestamp: new Date().toISOString() } : m));

      setConfirmOpen(false);
      setConfirmMovimiento(null);
      setConfirmDate("");
      setConfirmQty("");
    } catch (e) {
    } finally {
      setSavingConfirm(false);
    }
  }

  async function handleEliminarMovimiento(data) {
    setDeleteConfirm({ id: data.id, tienda: data.tienda || activeStore?.name, isPaq: !!data.tipo && data.tipo === "paqueteria" });
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm.id || !deleteConfirm.tienda) return;
    const db = getFirestore();
    await deleteDoc(doc(db, "Inventario", deleteConfirm.tienda, "MOVIMIENTOS", deleteConfirm.id));
    if (deleteConfirm.isPaq) {
      setPaqMovimientos(prev => prev.filter(m => m.id !== deleteConfirm.id));
    } else {
      setMovimientos(prev => prev.filter(m => m.id !== deleteConfirm.id));
    }
    setDeleteConfirm({ id: null, tienda: null, isPaq: false });
  }

  function handleDeleteCancel() {
    setDeleteConfirm({ id: null, tienda: null, isPaq: false });
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 mt-4">Inventarios</h2>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-sm text-gray-200">Cargando...</div>
        ) : (
          stores.map(store => {
            const count = alertCounts[store] ?? 0;
            const label =
              count === 1
                ? `${count} Producto en alerta stock`
                : `${count} Productos en alerta stock`;
            return (
              <div
                key={store}
                className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-2xl shadow-sm p-4 sm:p-5 items-stretch justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-3">
                  <div className="text-gray-800 font-semibold text-base md:text-lg">{store}</div>
                  <div className="flex-shrink-0 flex items-center">
                    <span className="rounded-full px-4 py-2 bg-slate-100 text-gray-700 text-xs md:text-sm font-medium shadow-sm whitespace-nowrap flex items-center min-w-[94px]">
                      {label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                  <button
                    onClick={() => abrirMovimientos(store)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-3 py-2 rounded-lg shadow-sm text-xs sm:text-base font-medium min-w-[110px]"
                  >
                    Movimientos
                  </button>
                  <button
                    onClick={() => openStoreInventario(store)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow text-xs sm:text-base font-semibold min-w-[110px]"
                  >
                    Ver Inventario
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {openInventario && activeStore && (
        <Inventario
          open={openInventario}
          onClose={closeInventario}
          tienda={activeStore}
          user={user}
        />
      )}
      {showMovimientos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeMovimientos} />
          <div className="relative bg-white rounded-2xl p-6 z-60 w-[97vw] max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Movimientos - {activeStore ? activeStore.name : ""}</h3>
              <button
                onClick={() => abrirPaqueteriasTienda(activeStore?.name)}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 text-gray-800 font-semibold"
                title="Ver movimientos de paqueterías (solo esta tienda)"
              >
                PAQUETERIAS
              </button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <label className="text-sm text-gray-600">Filtrar por fecha:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
              <button className="text-sm text-gray-600 underline" onClick={() => setSelectedDate("")}>Limpiar</button>
            </div>
            {selectedDate && filteredMovimientos.length > 0 && (
              <div className="mb-3 space-y-1">
                <div className="font-semibold text-sm text-gray-800">Resumen del día:</div>
                {resumenMovimientosDelDia().map(prod => (
                  <div key={prod.nombre} className="text-xs text-gray-700 flex gap-4">
                    <span>{prod.nombre}:</span>
                    <span>Stock inicial: <b>{prod.stockInicial}</b></span>
                    <span>Venta: <b>{prod.venta}</b></span>
                    <span>Stock final: <b>{prod.stockFinal}</b></span>
                  </div>
                ))}
              </div>
            )}
            {loadingMovimientos ? (
              <div className="text-sm text-gray-600">Cargando movimientos...</div>
            ) : filteredMovimientos.length === 0 ? (
              <div className="text-sm text-gray-600">No hay movimientos registrados para la fecha seleccionada.</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {filteredMovimientos.map(m => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">{m.productoNombre || m.productoId || m.producto || m.descripcion || "Movimiento"}</div>
                      <div className="text-xs text-gray-600">Tipo: {m.tipo || "—"}</div>
                      {typeof m.cantidad !== "undefined" && (
                        <div className="text-xs text-gray-600">Cantidad registrada: {m.cantidad}</div>
                      )}
                      {typeof m.precio !== "undefined" && (
                        <div className="text-xs text-gray-600">Precio unitario: {m.precio}</div>
                      )}
                      {m.cliente && (
                        <div className="text-xs text-gray-600">Cliente: {m.cliente}</div>
                      )}
                      {m.fechaPedido && (
                        <div className="text-xs text-gray-600">Fecha del pedido: {m.fechaPedido}</div>
                      )}
                      {m.empresa && <div className="text-xs text-gray-600">Empresa: {m.empresa}</div>}
                      {m.codigo && <div className="text-xs text-gray-600">Código: {m.codigo}</div>}
                      {m.usuario && <div className="text-xs text-gray-600">Usuario que registró: {m.usuario}</div>}
                      <div className="text-xs text-gray-500 mt-1">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</div>
                      {m.confirmado ? (
                        <div className="mt-2 text-xs text-green-700">
                          <div>Confirmado por: <span className="font-semibold text-gray-800">{m.confirmadoPor ?? "—"}</span></div>
                          <div>Fecha llegada: <span className="font-semibold text-gray-800">{m.fechaLlegada ?? "—"}</span></div>
                          <div>Cantidad llegada: <span className="font-semibold text-gray-800">{m.cantidadLlegada ?? "—"}</span></div>
                          {typeof m.diferencia !== "undefined" && <div>Diferencia: <span className="font-semibold">{m.diferencia}</span></div>}
                        </div>
                      ) : null}
                    </div>
                    <div className="ml-3 flex flex-col gap-2">
                      {isAdmin && (
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs"
                          onClick={() => handleEliminarMovimiento(m)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end items-center gap-2">
              <button
                onClick={closeMovimientos}
                aria-label="Cerrar movimientos"
                title="Cerrar"
                className="px-4 py-2 rounded-md bg-white border border-gray-300 shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showPaqModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closePaqModal} />
          <div className="relative bg-white rounded-2xl p-6 z-70 w-[97vw] max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Paqueterías - Movimientos</h3>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <label className="text-sm text-gray-600">Filtrar por fecha:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={paqSelectedDate}
                onChange={e => setPaqSelectedDate(e.target.value)}
              />
              <button className="text-sm text-gray-600 underline" onClick={() => setPaqSelectedDate("")}>Limpiar</button>
            </div>
            {loadingPaqMovs ? (
              <div className="text-sm text-gray-600">Cargando movimientos de paqueterías...</div>
            ) : filteredPaqMovimientos.length === 0 ? (
              <div className="text-sm text-gray-600">No hay movimientos de paqueterías para la fecha seleccionada.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredPaqMovimientos.map(m => (
                  <div key={`${m.tienda}_${m.id}`} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">{m.productoNombre || m.producto || "Movimiento"}</div>
                      <div className="text-xs text-gray-600">Tienda: <span className="font-medium text-gray-800">{m.tienda}</span></div>
                      <div className="text-xs text-gray-600">Cantidad registrada: {m.cantidad ?? "—"}</div>
                      {m.empresa && <div className="text-xs text-gray-600">Empresa: {m.empresa}</div>}
                      {m.codigo && <div className="text-xs text-gray-600">Código: {m.codigo}</div>}
                      {m.usuario && <div className="text-xs text-gray-600">Usuario que registró: {m.usuario}</div>}
                      {m.fechaPedido && (
                        <div className="text-xs text-gray-600">Fecha del pedido: {m.fechaPedido}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</div>
                      {m.confirmado ? (
                        <div className="mt-2 text-xs text-green-700">
                          <div>Confirmado por: <span className="font-semibold text-gray-800">{m.confirmadoPor ?? "—"}</span></div>
                          <div>Fecha llegada: <span className="font-semibold text-gray-800">{formatDateDisplay(m.fechaLlegada)}</span></div>
                          <div>Cantidad llegada: <span className="font-semibold text-gray-800">{m.cantidadLlegada ?? "—"}</span></div>
                          {typeof m.diferencia !== "undefined" && <div>Diferencia: <span className="font-semibold">{m.diferencia}</span></div>}
                        </div>
                      ) : null}
                    </div>
                    <div className="ml-3 flex flex-col gap-2">
                      {!m.confirmado && (
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-xs"
                          onClick={() => openConfirm(m)}
                        >
                          Confirmar
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs"
                          onClick={() => handleEliminarMovimiento(m)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={closePaqModal}
                className="px-4 py-2 rounded-md bg-white border border-gray-300 shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmOpen && confirmMovimiento && (
        <div className="fixed inset-0 z-70 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 z-80 w-[92vw] max-w-md">
            <h4 className="font-semibold mb-3">Confirmar llegada - {confirmMovimiento.productoNombre || confirmMovimiento.productoId}</h4>
            <label className="block text-sm text-gray-600 mb-1">Día de llegada</label>
            <input type="date" className="border rounded px-2 py-1 w-full mb-3" value={confirmDate} onChange={e => setConfirmDate(e.target.value)} />
            <label className="block text-sm text-gray-600 mb-1">Cantidad llegada</label>
            <input type="number" min="0" className="border rounded px-2 py-1 w-full mb-4" value={confirmQty} onChange={e => setConfirmQty(e.target.value)} />
            <div className="mb-3 text-sm text-gray-700">
              Usuario que confirmará: <span className="font-semibold">{typeof user === "string" ? user : (user?.nombre ?? "unknown")}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setConfirmOpen(false)} disabled={savingConfirm}>Cancelar</button>
              <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleConfirmSubmit} disabled={savingConfirm || !confirmDate || confirmQty === ""}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirm.id && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleDeleteCancel} />
          <div className="relative bg-white rounded-2xl p-6 z-110 w-[92vw] max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4">Eliminar Movimiento</h3>
            <div className="mb-6 text-center text-gray-700">
              ¿Seguro que deseas eliminar este movimiento? Esta acción <b>no se puede deshacer.</b>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteCancel} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}