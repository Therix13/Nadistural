import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { getAllStores } from "./firebase";
import Inventario from "./Inventario";

function formatDateDisplay(dateString) {
  if (!dateString) return "";
  try {
    // If it's an ISO datetime or yyyy-mm-dd, create Date and format
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
    // fallback to raw
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

  // New states for global paqueterias view
  const [showPaqModal, setShowPaqModal] = useState(false);
  const [paqMovimientos, setPaqMovimientos] = useState([]);
  const [loadingPaqMovs, setLoadingPaqMovs] = useState(false);
  const [paqSelectedDate, setPaqSelectedDate] = useState("");

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
      const ref = collection(db, "Inventario", storeName, "MOVIMIENTOS");
      const snap = await getDocs(ref);
      // Exclude paqueteria movements from per-store view (they go to global paqueterias)
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data(), tienda: storeName }))
        .filter(item => item.tipo !== "paqueteria");
      const ordered = docs.sort((a,b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
      setMovimientos(ordered);
    } catch (e) {
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }

  // New: abrir todos los movimientos de paqueterías (global)
  async function abrirPaqueteriasGlobal() {
    setShowPaqModal(true);
    setPaqMovimientos([]);
    setLoadingPaqMovs(true);
    try {
      const sDocs = await getAllStores();
      const storeNames = sDocs.map(s => (typeof s === "string" ? s : s.name)).filter(Boolean);
      const db = getFirestore();
      const all = [];
      await Promise.all(storeNames.map(async store => {
        try {
          const ref = collection(db, "Inventario", store, "MOVIMIENTOS");
          const snap = await getDocs(ref);
          snap.docs.forEach(d => {
            const data = d.data();
            if (data && data.tipo === "paqueteria") {
              all.push({ id: d.id, tienda: store, ...data });
            }
          });
        } catch (e) {
          // ignore store errors
        }
      }));
      const ordered = all.sort((a,b) => {
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
  };

  const closePaqModal = () => {
    setShowPaqModal(false);
    setPaqMovimientos([]);
    setPaqSelectedDate("");
  };

  const filteredMovimientos = selectedDate
    ? movimientos.filter(m => {
        try {
          const d = m.timestamp ? new Date(m.timestamp) : null;
          if (!d || isNaN(d.getTime())) return false;
          return d.toISOString().split("T")[0] === selectedDate;
        } catch (e) {
          return false;
        }
      })
    : movimientos;

  const filteredPaqMovimientos = paqSelectedDate
    ? paqMovimientos.filter(m => {
        try {
          const d = m.timestamp ? new Date(m.timestamp) : null;
          if (!d || isNaN(d.getTime())) return false;
          return d.toISOString().split("T")[0] === paqSelectedDate;
        } catch (e) {
          return false;
        }
      })
    : paqMovimientos;

  function openConfirm(m) {
    setConfirmMovimiento(m);
    const today = new Date().toISOString().split("T")[0];
    // Initialize with previously saved fechaLlegada/cantidadLlegada if present
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

      // update local lists (both possible sources)
      setMovimientos(prev => prev.map(m => m.id === confirmMovimiento.id ? { ...m, confirmado: true, fechaLlegada: confirmDate, cantidadLlegada: arrivedQty, diferencia: diff, confirmadoPor: actor, confirmadoTimestamp: new Date().toISOString() } : m));
      setPaqMovimientos(prev => prev.map(m => m.id === confirmMovimiento.id ? { ...m, confirmado: true, fechaLlegada: confirmDate, cantidadLlegada: arrivedQty, diferencia: diff, confirmadoPor: actor, confirmadoTimestamp: new Date().toISOString() } : m));

      setConfirmOpen(false);
      setConfirmMovimiento(null);
      setConfirmDate("");
      setConfirmQty("");
    } catch (e) {
      console.error("Error confirmando movimiento:", e);
    } finally {
      setSavingConfirm(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center text-white mb-6">Inventarios</h2>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-sm text-gray-200">Cargando...</div>
        ) : (
          stores.map(store => {
            const count = alertCounts[store] ?? 0;
            const label = count === 1 ? `${count} Producto` : `${count} Productos`;
            return (
              <div key={store} className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
                <div className="text-gray-800 font-medium">{store}</div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${count > 0 ? "bg-red-50 text-red-700 border border-red-100" : "bg-gray-100 text-gray-700"}`}>
                    {label}
                  </div>
                  <button
                    onClick={() => abrirMovimientos(store)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-3 py-2 rounded-lg shadow-sm"
                  >
                    Movimientos
                  </button>
                  <button
                    onClick={() => openStoreInventario(store)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
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

      {/* Movimientos por tienda modal */}
      {showMovimientos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeMovimientos} />
          <div className="relative bg-white rounded-2xl p-6 z-60 w-[92vw] max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Movimientos - {activeStore ? activeStore.name : ""}</h3>
              <button
                onClick={abrirPaqueteriasGlobal}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 text-gray-800 font-semibold"
                title="Ver movimientos de paqueterías (global)"
              >
                PAQUETERIAS
              </button>
            </div>

            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm text-gray-600">Filtrar por fecha:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
              <button className="ml-2 text-sm text-gray-600 underline" onClick={() => setSelectedDate("")}>Limpiar</button>
            </div>

            {loadingMovimientos ? (
              <div className="text-sm text-gray-600">Cargando movimientos...</div>
            ) : filteredMovimientos.length === 0 ? (
              <div className="text-sm text-gray-600">No hay movimientos registrados para la fecha seleccionada.</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {filteredMovimientos.map(m => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">{m.productoNombre || m.producto || m.descripcion || "Movimiento"}</div>
                      <div className="text-xs text-gray-600">Tipo: {m.tipo || "—"}</div>
                      <div className="text-xs text-gray-600">Cantidad registrada: {m.cantidad ?? "—"}</div>
                      {m.empresa && <div className="text-xs text-gray-600">Empresa: {m.empresa}</div>}
                      {m.codigo && <div className="text-xs text-gray-600">Código: {m.codigo}</div>}
                      {m.usuario && <div className="text-xs text-gray-600">Usuario que registró: {m.usuario}</div>}

                      {m.confirmado ? (
                        <div className="mt-2 text-xs text-green-700">
                          <div>Confirmado por: <span className="font-semibold text-gray-800">{m.confirmadoPor ?? "—"}</span></div>
                          <div>Fecha llegada: <span className="font-semibold text-gray-800">{formatDateDisplay(m.fechaLlegada)}</span></div>
                          <div>Cantidad llegada: <span className="font-semibold text-gray-800">{m.cantidadLlegada ?? "—"}</span></div>
                          {typeof m.diferencia !== "undefined" && <div>Diferencia: <span className="font-semibold">{m.diferencia}</span></div>}
                        </div>
                      ) : null}

                      <div className="text-xs text-gray-500 mt-1">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</div>
                    </div>
                    <div className="ml-3 flex flex-col gap-2">
                      {!m.confirmado && m.tipo === "paqueteria" && (
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                          onClick={() => openConfirm(m)}
                        >
                          Confirmar
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

      {/* Global PAQUETERIAS modal */}
      {showPaqModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closePaqModal} />
          <div className="relative bg-white rounded-2xl p-6 z-70 w-[92vw] max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Paqueterías - Movimientos</h3>
            </div>

            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm text-gray-600">Filtrar por fecha:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={paqSelectedDate}
                onChange={e => setPaqSelectedDate(e.target.value)}
              />
              <button className="ml-2 text-sm text-gray-600 underline" onClick={() => setPaqSelectedDate("")}>Limpiar</button>
            </div>

            {loadingPaqMovs ? (
              <div className="text-sm text-gray-600">Cargando movimientos de paqueterías...</div>
            ) : filteredPaqMovimientos.length === 0 ? (
              <div className="text-sm text-gray-600">No hay movimientos de paqueterías para la fecha seleccionada.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredPaqMovimientos.map(m => (
                  <div key={`${m.tienda}_${m.id}`} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{m.productoNombre || m.producto || "Movimiento"}</div>
                        <div className="text-xs text-gray-600">Tienda: <span className="font-medium text-gray-800">{m.tienda}</span></div>
                        <div className="text-xs text-gray-600">Cantidad registrada: {m.cantidad ?? "—"}</div>
                        {m.empresa && <div className="text-xs text-gray-600">Empresa: {m.empresa}</div>}
                        {m.codigo && <div className="text-xs text-gray-600">Código: {m.codigo}</div>}
                        {m.usuario && <div className="text-xs text-gray-600">Usuario que registró: {m.usuario}</div>}

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
                            className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                            onClick={() => openConfirm(m)}
                          >
                            Confirmar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</div>
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
    </div>
  );
}