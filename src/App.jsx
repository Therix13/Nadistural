import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Login from "./Login";
import Configuracion from "./Configuracion";
import PedidoModal from "./PedidoModal";
import Exportarexcel from "./Exportarexcel";
import {
  findUserByCredentials,
  getAllUsers,
  getAllStores,
  addUserToFirestore,
  updateUserInFirestore,
  addStoreToFirestore,
  addPedidoToTienda,
  getPedidosByTienda,
  getPedidosCounterByTiendaForNextDelivery,
  deleteUserFromFirestore,
  deleteStoreFromFirestore,
  deletePedidoFromTienda,
  updatePedidoInTienda
} from "./firebase";

const zoomIconStyles = "transition-transform duration-200 group-hover:scale-125";
const IconDelete = () => (
  <span className="group inline-block">
    <svg className={`w-5 h-5 text-rose-500 ${zoomIconStyles}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </span>
);
const IconEdit = () => (
  <span className="group inline-block">
    <svg className={`w-5 h-5 text-blue-500 ${zoomIconStyles}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L7.5 21H3v-4.5L16.732 3.732z"/>
    </svg>
  </span>
);
const IconConfirm = () => (
  <span className="group inline-block">
    <svg className={`w-5 h-5 text-green-500 ${zoomIconStyles}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  </span>
);
const IconArrowLeft = () => (
  <svg className="w-8 h-8 text-slate-700 hover:text-blue-600 transition" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

function ConfirmPopup({ open, onClose, onAction }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 min-w-[300px] max-w-sm flex flex-col items-center animate-fadein">
        <h3 className="text-xl font-bold mb-4 text-slate-800">Confirmar pedido</h3>
        <p className="mb-6 text-slate-600">Selecciona una acción:</p>
        <div className="flex flex-col gap-3 w-full">
          <button className="w-full px-5 py-3 rounded-xl font-bold bg-green-700 text-white shadow-md hover:bg-green-800 transition" onClick={() => onAction("efectivo")}>Efectivo</button>
          <button className="w-full px-5 py-3 rounded-xl font-bold bg-blue-700 text-white shadow-md hover:bg-blue-800 transition" onClick={() => onAction("transferencia")}>Transferencia</button>
          <button className="w-full px-5 py-3 rounded-xl font-bold bg-yellow-600 text-yellow-950 shadow-md hover:bg-yellow-700 transition" onClick={() => onAction("reagendo")}>Reagendo</button>
          <button className="w-full px-5 py-3 rounded-xl font-bold bg-red-700 text-white shadow-md hover:bg-red-800 transition" onClick={() => onAction("cancelado")}>Cancelado</button>
        </div>
        <button onClick={onClose} className="mt-6 px-5 py-2 bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300 font-semibold shadow">Cerrar</button>
      </div>
    </div>
  );
}

function ReagendarPopup({ open, onClose, onConfirm, fechaOriginal }) {
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const [nuevaFecha, setNuevaFecha] = useState(minDate);

  useEffect(() => {
    if (open) setNuevaFecha(minDate);
  }, [open, minDate]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[102] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4">Reagendar Pedido</h2>
        <p className="mb-3 text-slate-700">Fecha original: <b>{fechaOriginal}</b></p>
        <label className="w-full text-left mb-2 text-slate-700 font-medium">Nueva fecha:</label>
        <input type="date" value={nuevaFecha} min={minDate} className="input w-full mb-4" onChange={e => setNuevaFecha(e.target.value)} />
        <div className="flex gap-2 mt-2 justify-end w-full">
          <button type="button" className="px-4 py-2 bg-slate-200 rounded-xl" onClick={onClose}>Cancelar</button>
          <button type="button" className="px-4 py-2 bg-yellow-500 text-slate-900 rounded-xl font-bold" onClick={() => onConfirm(nuevaFecha)}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function Tiendas({ stores, onSelectStore, isAdmin }) {
  const [pedidosCounts, setPedidosCounts] = useState({});
  const [deliveryLabel, setDeliveryLabel] = useState("Pedidos para mañana");

  useEffect(() => {
    const today = new Date();
    let label = "Pedidos para mañana";
    if (today.getDay() === 6) label = "Pedidos para el Lunes";
    setDeliveryLabel(label);

    async function fetchCounters() {
      const counts = {};
      for (const store of stores) {
        counts[store] = await getPedidosCounterByTiendaForNextDelivery(store);
      }
      setPedidosCounts(counts);
    }
    if (stores && stores.length > 0) fetchCounters();
  }, [stores]);

  return (
    <section className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col items-center text-center w-full mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Tiendas</h2>
      <div className="flex flex-wrap gap-6 justify-center items-center">
        {stores.map(store => (
          <div key={store} className="bg-slate-50 shadow border px-6 py-5 rounded-xl flex flex-col items-center justify-center" style={{ minWidth: 200 }}>
            <span className="font-bold text-lg mb-2">{store}</span>
            <span className="text-base text-slate-600 mb-3">
              {deliveryLabel}: <b>{pedidosCounts[store] ?? 0}</b>
            </span>
            <button className="mt-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold" onClick={() => onSelectStore(store)}>Ver pedidos</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function getFechaAgendadaHoy() {
  const today = new Date();
  let targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 1);
  if (today.getDay() === 6) {
    targetDate.setDate(today.getDate() + 2);
  }
  const yyyy = targetDate.getFullYear();
  const mm = `${targetDate.getMonth() + 1}`.padStart(2, "0");
  const dd = `${targetDate.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatoFecha(fechaString) {
  if (!fechaString) return "";
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const [yyyy, mm, dd] = fechaString.split("-");
  const fecha = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(fecha.getTime())) return "";
  const dia = diasSemana[fecha.getDay()];
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const y = String(fecha.getFullYear()).slice(2);
  return `${dia}_${d}/${m}/${y}`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [currentUserObj, setCurrentUserObj] = useState(null);
  const [view, setView] = useState("inicio");
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showReagendarPopup, setShowReagendarPopup] = useState(false);
  const [reagendarIdx, setReagendarIdx] = useState(null);
  const [pedidosPorTienda, setPedidosPorTienda] = useState({});
  const [filtroFecha, setFiltroFecha] = useState("ninguna");
  const [editingIndex, setEditingIndex] = useState(null);
  const [confirmIdx, setConfirmIdx] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const uDocs = await getAllUsers();
        const mappedUsers = uDocs.map((d) => ({
          id: d.id,
          nombre: d.nombre,
          password: d.password,
          rol: d.rol || "usuario",
          stores: d.stores || [],
        }));
        setUsers(mappedUsers);
        const sDocs = await getAllStores();
        setStores(sDocs.map((s) => s.name));
        if (user) {
          const existing = mappedUsers.find((u) => u.nombre === user);
          if (existing) setCurrentUserObj(existing);
        }
      } catch (err) {
        console.error("Error cargando datos desde Firestore:", err);
      }
    }
    load();
  }, [user]);
  useEffect(() => {
    async function cargarPedidosTienda() {
      if (selectedStore) {
        try {
          const pedidos = await getPedidosByTienda(selectedStore);
          setPedidosPorTienda((prev) => ({ ...prev, [selectedStore]: pedidos }));
        } catch (err) {
          console.error("Error leyendo pedidos de Firestore:", err);
        }
      }
    }
    cargarPedidosTienda();
  }, [selectedStore, showPedidoModal]);
  const handleLogin = async (username, password) => {
    const u = (username || "").trim();
    const p = password || "";
    if (!u || !p) {
      return { ok: false, message: "Completa usuario y contraseña." };
    }
    try {
      const found = await findUserByCredentials(u, p);
      if (found) {
        setUser(found.nombre);
        setCurrentUserObj({
          id: found.id,
          nombre: found.nombre,
          password: found.password,
          rol: found.rol || "usuario",
          stores: found.stores || [],
        });
        setView("inicio");
        setUsers((prev) => {
          const exists = prev.some((x) => x.nombre === found.nombre);
          if (exists) {
            return prev.map((x) =>
              x.nombre === found.nombre
                ? {
                    id: found.id,
                    nombre: found.nombre,
                    password: found.password,
                    rol: found.rol || "usuario",
                    stores: found.stores || [],
                  }
                : x
            );
          }
          return [
            ...prev,
            {
              id: found.id,
              nombre: found.nombre,
              password: found.password,
              rol: found.rol || "usuario",
              stores: found.stores || [],
            },
          ];
        });
        return { ok: true };
      }
      if (u === "admin" && p === "admin") {
        setUser("admin");
        setCurrentUserObj({ id: null, nombre: "admin", rol: "admin", stores: [] });
        setView("inicio");
        return { ok: true };
      }
      return { ok: false, message: "Usuario o contraseña incorrectos." };
    } catch (err) {
      console.error("handleLogin error:", err);
      return { ok: false, message: "Error al autenticar. Revisa la consola." };
    }
  };
  const handleLogout = () => {
    setUser(null);
    setCurrentUserObj(null);
    setView("inicio");
    setSelectedStore(null);
  };
  const handleAddUser = async (newUser) => {
    if (!newUser || !newUser.nombre) return;
    try {
      if (newUser.id) {
        const id = newUser.id;
        const payload = {
          nombre: newUser.nombre,
          password: newUser.password,
          rol: newUser.rol,
          stores: newUser.stores || [],
        };
        await updateUserInFirestore(id, payload);
        setUsers((prev) => prev.map((u) => (u.id === id ? { id, ...payload } : u)));
        if (currentUserObj && (currentUserObj.id === id || currentUserObj.nombre === newUser.nombre)) {
          setCurrentUserObj({ id, ...payload });
          setUser(payload.nombre);
        }
      } else {
        const created = await addUserToFirestore({
          nombre: newUser.nombre,
          password: newUser.password,
          rol: newUser.rol,
          stores: newUser.stores || [],
        });
        const createdUser = {
          id: created.id,
          nombre: created.nombre,
          password: created.password,
          rol: created.rol || "usuario",
          stores: created.stores || [],
        };
        setUsers((prev) => [...prev, createdUser]);
        if (user === createdUser.nombre) {
          setCurrentUserObj(createdUser);
        }
      }
    } catch (err) {
      console.error("handleAddUser error:", err);
    }
  };
  const handleUpdateUser = async (updatedUser) => {
    if (!updatedUser) return;
    try {
      if (updatedUser.id) {
        const id = updatedUser.id;
        const payload = {};
        if (updatedUser.nombre !== undefined) payload.nombre = updatedUser.nombre;
        if (updatedUser.password !== undefined) payload.password = updatedUser.password;
        if (updatedUser.rol !== undefined) payload.rol = updatedUser.rol;
        if (updatedUser.stores !== undefined) payload.stores = updatedUser.stores;
        await updateUserInFirestore(id, payload);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  id,
                  nombre: payload.nombre ?? u.nombre,
                  password: payload.password ?? u.password,
                  rol: payload.rol ?? u.rol,
                  stores: payload.stores ?? u.stores,
                }
              : u
          )
        );
        if (currentUserObj && (currentUserObj.id === id || currentUserObj.nombre === updatedUser.originalNombre)) {
          const newObj = {
            id,
            nombre: payload.nombre ?? currentUserObj.nombre,
            password: payload.password ?? currentUserObj.password,
            rol: payload.rol ?? currentUserObj.rol,
            stores: payload.stores ?? currentUserObj.stores,
          };
          setCurrentUserObj(newObj);
          setUser(newObj.nombre);
        }
        return;
      }
      if (updatedUser.originalNombre) {
        setUsers((prev) => {
          const conflict = prev.some((u) => u.nombre === updatedUser.nombre && u.nombre !== updatedUser.originalNombre);
          if (conflict) return prev;
          return prev.map((u) => {
            if (u.nombre !== updatedUser.originalNombre) return u;
            const newPassword = updatedUser.password === undefined || updatedUser.password === "" ? u.password : updatedUser.password;
            const out = {
              ...u,
              nombre: updatedUser.nombre ?? u.nombre,
              password: newPassword,
              rol: updatedUser.rol ?? u.rol,
              stores: updatedUser.stores ?? u.stores ?? [],
            };
            if (currentUserObj && currentUserObj.nombre === updatedUser.originalNombre) {
              setCurrentUserObj({ id: u.id, nombre: out.nombre, password: out.password, rol: out.rol, stores: out.stores });
              setUser(out.nombre);
            }
            return out;
          });
        });
      }
    } catch (err) {
      console.error("handleUpdateUser error:", err);
    }
  };
  const handleAddStore = async (storeName) => {
    if (!storeName || !storeName.trim()) return;
    const s = storeName.trim();
    try {
      if (stores.includes(s)) return;
      const created = await addStoreToFirestore(s);
      setStores((prev) => [...prev, created.name]);
    } catch (err) {
      console.error("handleAddStore error:", err);
    }
  };
  const handleSelectStore = async (storeName) => {
    if (!storeName) return;
    setSelectedStore(storeName);
    setView("store");
  };
  const handleAddPedido = async (pedido) => {
    if (editingIndex !== null) {
      const pedidoActual = pedidosDeEstaTienda[editingIndex];
      try {
        await updatePedidoInTienda(selectedStore, pedidoActual.id, { ...pedido, vendedor: user });
        setPedidosPorTienda((prev) => {
          const pedidos = [...(prev[selectedStore] || [])];
          pedidos[editingIndex] = { id: pedidoActual.id, ...pedido, vendedor: user };
          return { ...prev, [selectedStore]: pedidos };
        });
        setShowPedidoModal(false);
        setEditingIndex(null);
      } catch (err) {
        console.error("Error editando pedido en Firestore:", err);
      }
    } else {
      try {
        await addPedidoToTienda(selectedStore, { ...pedido, vendedor: user });
        setShowPedidoModal(false);
      } catch (err) {
        console.error("Error guardando el pedido en Firestore:", err);
      }
    }
  };
  const handleEliminarPedido = async (pedidoId) => {
    const idx = pedidosDeEstaTienda.findIndex(p => p.id === pedidoId);
    const pedido = pedidosDeEstaTienda[idx];
    if (!pedido || !selectedStore) return;
    try {
      await deletePedidoFromTienda(selectedStore, pedido.id);
      setPedidosPorTienda((prev) => {
        const pedidos = [...(prev[selectedStore] || [])];
        pedidos.splice(idx, 1);
        return { ...prev, [selectedStore]: pedidos };
      });
      if (editingIndex === idx) setEditingIndex(null);
    } catch (err) {
      console.error("Error eliminando el pedido de Firestore:", err);
    }
  };
  const handleEditarPedido = (pedidoId) => {
    const idx = pedidosDeEstaTienda.findIndex(p => p.id === pedidoId);
    setEditingIndex(idx);
    setShowPedidoModal(true);
  };
  const handleConfirmarPedido = async (pedidoId) => {
    const idx = pedidosDeEstaTienda.findIndex(p => p.id === pedidoId);
    setConfirmIdx(idx);
    setShowConfirmPopup(true);
  };
  const handlePedidoAccion = async (accion) => {
    const pedido = pedidosDeEstaTienda[confirmIdx];
    if (!pedido || !selectedStore) {
      setShowConfirmPopup(false);
      setConfirmIdx(null);
      return;
    }
    if (accion === "reagendo") {
      setShowConfirmPopup(false);
      setShowReagendarPopup(true);
      setReagendarIdx(confirmIdx);
      return;
    }
    try {
      await updatePedidoInTienda(selectedStore, pedido.id, { ...pedido, estado: accion });
      setPedidosPorTienda((prev) => {
        const pedidos = [...(prev[selectedStore] || [])];
        if (pedidos[confirmIdx]) {
          pedidos[confirmIdx] = { ...pedidos[confirmIdx], estado: accion };
        }
        return { ...prev, [selectedStore]: pedidos };
      });
      setShowConfirmPopup(false);
      setConfirmIdx(null);
    } catch (err) {
      console.error("Error confirmando pedido en Firestore:", err);
      setShowConfirmPopup(false);
      setConfirmIdx(null);
    }
  };
  const handleReagendarConfirm = async (nuevaFecha) => {
    const pedido = pedidosDeEstaTienda[reagendarIdx];
    if (!pedido || !selectedStore) {
      setShowReagendarPopup(false);
      setReagendarIdx(null);
      setConfirmIdx(null);
      return;
    }
    try {
      await updatePedidoInTienda(selectedStore, pedido.id, { ...pedido, estado: "reagendo", fecha: nuevaFecha });
      setPedidosPorTienda((prev) => {
        const pedidos = [...(prev[selectedStore] || [])];
        if (pedidos[reagendarIdx]) {
          pedidos[reagendarIdx] = {
            ...pedidos[reagendarIdx],
            estado: "reagendo",
            fecha: nuevaFecha,
          };
        }
        return { ...prev, [selectedStore]: pedidos };
      });
      setShowReagendarPopup(false);
      setReagendarIdx(null);
      setConfirmIdx(null);
    } catch (err) {
      console.error("Error reagendando pedido en Firestore:", err);
      setShowReagendarPopup(false);
      setReagendarIdx(null);
      setConfirmIdx(null);
    }
  };
  const handleReagendarCancel = () => {
    setShowReagendarPopup(false);
    setReagendarIdx(null);
    setConfirmIdx(null);
  };
  const handleDeleteUser = async (id) => {
    try {
      await deleteUserFromFirestore(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (currentUserObj?.id === id) {
        setUser(null);
        setCurrentUserObj(null);
      }
    } catch (err) {
      console.error("Error eliminando el usuario de Firestore:", err);
    }
  };
  const handleDeleteStore = async (storeName) => {
    try {
      await deleteStoreFromFirestore(storeName);
      setStores(prev => prev.filter(s => s !== storeName));
      setPedidosPorTienda(prev => {
        const nuevo = { ...prev };
        delete nuevo[storeName];
        return nuevo;
      });
      if (selectedStore === storeName) setSelectedStore(null);
    } catch (err) {
      console.error("Error eliminando la tienda de Firestore:", err);
    }
  };
  const isAdmin = currentUserObj?.rol === "admin" || user === "admin";
  const visibleStores = isAdmin
    ? stores
    : (currentUserObj?.stores?.length ? currentUserObj.stores : stores);
  const pedidosDeEstaTienda = Array.isArray(pedidosPorTienda[selectedStore])
    ? pedidosPorTienda[selectedStore]
    : [];
  const pedidosDeEstaTiendaOrdenados = [...pedidosDeEstaTienda].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const fechasUnicas = [...new Set(pedidosDeEstaTiendaOrdenados.map(p => p.fecha).filter(Boolean))].sort((a,b)=>new Date(b)-new Date(a));
  const pedidosFiltrados = filtroFecha === "ninguna"
    ? []
    : filtroFecha === ""
    ? pedidosDeEstaTiendaOrdenados
    : pedidosDeEstaTiendaOrdenados.filter(p => p.fecha === filtroFecha);
  const pedidoAEditar = editingIndex !== null ? pedidosDeEstaTienda[editingIndex] : undefined;
  const isAnyPopupOpen = showPedidoModal || showConfirmPopup || showReagendarPopup;
  function canEditDeleteConfirm(estado, isAdmin) {
    if (isAdmin) return true;
    return estado === "reagendo" || estado === undefined || estado === "";
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col relative">
      {user && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onNavigate={setView}
          currentView={view}
          isAdmin={isAdmin}
        />
      )}
      {isAnyPopupOpen &&
        <div className="fixed inset-0 z-[99] pointer-events-auto select-auto" />
      }
      {showPedidoModal && (
        <PedidoModal
          open={showPedidoModal}
          onClose={() => { setShowPedidoModal(false); setEditingIndex(null); }}
          onSubmit={handleAddPedido}
          initialValues={pedidoAEditar || undefined}
        />
      )}
      {showConfirmPopup && (
        <ConfirmPopup
          open={showConfirmPopup}
          onClose={() => { setShowConfirmPopup(false); setConfirmIdx(null); }}
          onAction={handlePedidoAccion}
        />
      )}
      {showReagendarPopup && (
        <ReagendarPopup
          open={showReagendarPopup}
          onClose={handleReagendarCancel}
          onConfirm={handleReagendarConfirm}
          fechaOriginal={reagendarIdx !== null && pedidosDeEstaTienda[reagendarIdx] ? pedidosDeEstaTienda[reagendarIdx].fecha : ""}
        />
      )}
      <main className="flex-1 flex items-center justify-center pt-6 px-2 md:px-4">
        <div className={`w-[90vw] flex justify-center`}>
          {!user ? (
            <Login onLogin={handleLogin} />
          ) : (
            <>
              {view === "tiendas" && (
                <Tiendas
                  stores={visibleStores}
                  onSelectStore={handleSelectStore}
                  isAdmin={isAdmin}
                />
              )}
              {view === "store" && selectedStore && (
                <section
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center text-center w-full mx-auto"
                  style={{
                    maxWidth: "1200px",
                    width: "100%",
                    minHeight: "65vh",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "2.5rem 2vw",
                    position: "relative",
                  }}
                >
                  <button
                    className="absolute top-5 left-5 rounded-full bg-white p-2 shadow hover:bg-blue-50 border border-slate-200 z-10"
                    title="Volver a Tiendas"
                    onClick={() => setView("tiendas")}
                    style={{ boxShadow: "0 0 12px 0 rgba(0,0,0,0.09)" }}
                  >
                    <IconArrowLeft />
                  </button>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                    Tienda: <span className="font-semibold">{selectedStore}</span>
                  </h2>
                  <p className="text-base text-slate-500 mb-6">Has entrado a {selectedStore}.</p>
                  <button
                    onClick={() => {
                      setEditingIndex(null);
                      setShowPedidoModal(true);
                    }}
                    className="w-full md:max-w-lg px-4 py-3 mb-4 rounded-xl bg-gradient-to-b from-green-500 to-green-600 text-white font-semibold text-base shadow-md hover:opacity-95 transition"
                    style={{
                      minWidth: "200px",
                      maxWidth: "480px",
                      width: "80%",
                    }}
                  >
                    Agregar Pedido
                  </button>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 text-left">Pedidos</h3>
                  <div className="w-full flex justify-end mb-2">
                    <Exportarexcel pedidos={pedidosDeEstaTiendaOrdenados} tienda={selectedStore} />
                  </div>
                  <div style={{ width: "100%", minWidth: "700px", maxWidth: "100%", overflowX: "auto" }}>
                    <table className="min-w-full border border-slate-200 rounded-xl shadow bg-white" style={{ width: "100%", minWidth: "700px", maxWidth: "100vw" }}>
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Cliente</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Dirección</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Entre calles</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Teléfono</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Productos</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Precio</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Nota</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Fecha</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-left">Vendedor</th>
                          <th className="px-3 py-2 border-b font-bold text-slate-700 text-xs text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidosFiltrados.length
                          ? pedidosFiltrados.map((pedido) => {
                              let colorFila = "";
                              let colorNombre = "";
                              if (pedido.estado === "efectivo") colorFila = "bg-green-700 text-white";
                              if (pedido.estado === "transferencia") colorFila = "bg-blue-700 text-white";
                              if (pedido.estado === "cancelado") colorFila = "bg-red-700 text-white";
                              if (pedido.estado === "reagendo") colorNombre = "bg-yellow-400 text-yellow-900 font-bold rounded px-1";
                              return (
                                <tr key={pedido.id} className={`${colorFila}`}>
                                  <td className="px-3 py-2 border-b text-left">
                                    <span className={colorNombre}>{pedido.nombre || ""}</span>
                                  </td>
                                  <td className="px-3 py-2 border-b text-left">
                                    {[pedido.calleNumero, pedido.colonia, pedido.municipio, pedido.codigoPostal].filter(Boolean).join(", ")}
                                  </td>
                                  <td className="px-3 py-2 border-b text-left">{pedido.entreCalles || ""}</td>
                                  <td className="px-3 py-2 border-b text-left">{pedido.telefono || ""}</td>
                                  <td className="px-3 py-2 border-b text-left">
                                    {pedido.productos?.map((p, i) => (
                                      <span key={i} style={{ whiteSpace: "nowrap" }}>
                                        <span className="font-semibold">{p.cantidad}</span> <span>{p.producto}</span>
                                        {i < pedido.productos.length - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="px-3 py-2 border-b text-left">{pedido.precio || ""}</td>
                                  <td className="px-3 py-2 border-b text-left">{pedido.nota || ""}</td>
                                  <td className="px-3 py-2 border-b text-left">{formatoFecha(pedido.fecha)}</td>
                                  <td className="px-3 py-2 border-b text-left">{pedido.vendedor || ""}</td>
                                  <td className="px-3 py-2 border-b text-center align-middle">
                                    <div className="flex justify-center items-center gap-2">
                                      {canEditDeleteConfirm(pedido.estado, isAdmin) && (
                                        <>
                                          <button
                                            title="Editar"
                                            className="focus:outline-none group"
                                            onClick={() => handleEditarPedido(pedido.id)}
                                            disabled={isAnyPopupOpen}
                                          >
                                            <IconEdit />
                                          </button>
                                          <button
                                            title="Eliminar"
                                            className="focus:outline-none group"
                                            onClick={() => handleEliminarPedido(pedido.id)}
                                            disabled={isAnyPopupOpen}
                                          >
                                            <IconDelete />
                                          </button>
                                          <button
                                            title="Confirmar"
                                            className="focus:outline-none group"
                                            onClick={() => handleConfirmarPedido(pedido.id)}
                                            disabled={isAnyPopupOpen}
                                          >
                                            <IconConfirm />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          : (
                            <tr>
                              <td className="px-3 py-2 border-b text-left" colSpan={10}></td>
                            </tr>
                          )
                        }
                        <tr>
                          <td colSpan={10} className="px-3 py-2 border-b text-left align-middle">
                            <div className="flex items-center gap-2">
                              <label htmlFor="filtroFecha" className="text-slate-700 text-base font-medium mr-2">Filtrar por fecha:</label>
                              <select
                                id="filtroFecha"
                                value={filtroFecha}
                                onChange={e => setFiltroFecha(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-base focus:outline-blue-400 shadow"
                                style={{ minWidth: "120px", fontSize: "1rem", background: "white" }}
                              >
                                <option value="ninguna">Ninguna</option>
                                <option value="">Todas</option>
                                {fechasUnicas.map(fecha => (
                                  <option key={fecha} value={fecha}>{formatoFecha(fecha)}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setFiltroFecha("ninguna")}
                                className="ml-2 px-3 py-2 bg-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-300 transition"
                              >
                                Limpiar
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {view === "inicio" && (
                <section className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col items-center text-center w-full max-w-4xl mx-auto">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    Bienvenido, <span className="font-bold">{user}</span>
                  </h2>
                  <p className="text-sm text-slate-500">Esta es la pantalla de Inicio.</p>
                </section>
              )}
              {view === "inventario" && (
                <section className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col items-center text-center w-full max-w-4xl mx-auto">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Inventario</h2>
                  <p className="text-sm text-slate-500">Aquí irá la sección de Inventario.</p>
                </section>
              )}
              {view === "configuracion" && isAdmin && (
                <Configuracion
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  onUpdateUser={handleUpdateUser}
                  stores={stores}
                  onAddStore={handleAddStore}
                  onDeleteStore={handleDeleteStore}
                  users={users}
                  currentUser={currentUserObj?.nombre ?? user}
                />
              )}
              {view === "configuracion" && !isAdmin && (
                <section className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 text-center w-full max-w-4xl mx-auto">
                  <h3 className="text-base font-semibold text-slate-900">Acceso denegado</h3>
                  <p className="text-sm text-slate-500 mt-2">Solo los administradores pueden acceder a Configuración.</p>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}