import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Login from "./Login";
import Configuracion from "./Configuracion";
import PedidoModal from "./PedidoModal";
import Exportarexcel from "./Exportarexcel";
import PedidosTable from "./PedidosTable";
import Tiendas from "./Tiendas";
import TiendasInventario from "./TiendasInventario";
import ConfirmarPedidoPopup from "./ConfirmarPedidoPopup";
import {
  findUserByCredentials,
  getAllUsers,
  getAllStores,
  addUserToFirestore,
  updateUserInFirestore,
  addStoreToFirestore,
  addPedidoToTienda,
  deleteUserFromFirestore,
  deleteStoreFromFirestore,
  deletePedidoFromTienda,
  updatePedidoInTienda,
  onPedidosByTiendaRealtime
} from "./firebase";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";

const IconArrowLeft = () => (
  <svg className="w-8 h-8 text-slate-700 hover:text-blue-600 transition" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

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

async function rebajarStockPorPedido(pedido, tiendaName) {
  if (!pedido || !Array.isArray(pedido.productos)) return;
  const db = getFirestore();
  for (const { producto, cantidad } of pedido.productos) {
    if (!producto || !cantidad) continue;
    const productoRef = doc(db, "Inventario", tiendaName, "PRODUCTOS", producto);
    const snap = await getDoc(productoRef);
    if (!snap.exists()) continue;
    const stockActual = Number(snap.data().cantidad) || 0;
    const nuevoStock = stockActual - Number(cantidad);
    await updateDoc(productoRef, { cantidad: nuevoStock >= 0 ? nuevoStock : 0 });
  }
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
  const [productosTienda, setProductosTienda] = useState([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("sesion_usuario");
    if (storedUsername && !user) {
      setUser(storedUsername);
      try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("inventario_session", String(Date.now())); } catch (e) {}
    }
  }, []);

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
    let unsubscribe = null;
    if (selectedStore) {
      unsubscribe = onPedidosByTiendaRealtime(selectedStore, (pedidos) => {
        setPedidosPorTienda((prev) => ({ ...prev, [selectedStore]: pedidos }));
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedStore, showPedidoModal]);

  useEffect(() => {
    async function cargarProductosTienda() {
      if (!selectedStore) {
        setProductosTienda([]);
        return;
      }
      const db = getFirestore();
      const ref = collection(db, "Inventario", selectedStore, "PRODUCTOS");
      const snap = await getDocs(ref);
      setProductosTienda(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (showPedidoModal) {
      cargarProductosTienda();
    }
  }, [selectedStore, showPedidoModal]);

  const handleLogin = async (username, password, rememberMe) => {
    const u = (username || "").trim();
    const p = password || "";
    if (!u || !p) {
      return { ok: false, message: "Completa usuario y contraseña." };
    }
    try {
      const found = await findUserByCredentials(u, p);
      if (found) {
        setUser(found.nombre);
        try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("inventario_session", String(Date.now())); } catch (e) {}
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
        if (rememberMe) {
          localStorage.setItem("sesion_usuario", u);
        }
        return { ok: true };
      }
      if (u === "admin" && p === "admin") {
        setUser("admin");
        try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("inventario_session", String(Date.now())); } catch (e) {}
        setCurrentUserObj({ id: null, nombre: "admin", rol: "admin", stores: [] });
        setView("inicio");
        if (rememberMe) {
          localStorage.setItem("sesion_usuario", u);
        }
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
    localStorage.removeItem("sesion_usuario");
    try { if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("inventario_session"); } catch (e) {}
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
    if (!pedidoId || !selectedStore) return;
    try {
      await deletePedidoFromTienda(selectedStore, pedidoId);
      setEditingIndex(null);
    } catch (err) {
      console.error("Error eliminando el pedido de Firestore:", err);
    }
  };

  const handleEditarPedido = (pedidoId) => {
    const idx = pedidosDeEstaTienda.findIndex(p => p.id === pedidoId);
    setEditingIndex(idx);
    setShowPedidoModal(true);
  };

  const handleShowPopupConfirmar = (pedidoId) => {
    const idx = pedidosDeEstaTienda.findIndex(p => p.id === pedidoId);
    setConfirmIdx(idx);
    setShowConfirmPopup(true);
  };

  const handlePedidoAccion = async (accion, metodoPagoArg) => {
    const pedido = pedidosDeEstaTienda[confirmIdx];
    if (!pedido || !selectedStore) {
      setShowConfirmPopup(false);
      setConfirmIdx(null);
      return;
    }
    if (accion === "reagendar") {
      setShowConfirmPopup(false);
      setShowReagendarPopup(true);
      setReagendarIdx(confirmIdx);
      return;
    }
    try {
      const data = {
  ...pedido,
  estado: "reagendar",
  fecha: nuevaFecha
};
      if (data.metodoPago === undefined) delete data.metodoPago;
      Object.keys(data).forEach(k => {
        if (typeof data[k] === "undefined") delete data[k];
      });
      await updatePedidoInTienda(selectedStore, pedido.id, data);

      if (metodoPagoArg === "Efectivo" || metodoPagoArg === "Transferencia") {
        await rebajarStockPorPedido(pedido, selectedStore);
      }

      if (pedido.productos && Array.isArray(pedido.productos)) {
        const db = getFirestore();
        const movimientosRef = collection(db, "Inventario", selectedStore, "MOVIMIENTOS");
        const usuario = typeof user === "string" ? user : (user?.nombre ?? "unknown");
        const cliente = pedido.cliente || "";
        const fechaPedido = pedido.fecha || "";
        const movimientos = pedido.productos.map(p => ({
          productoId: p.producto,
          cantidad: Number(p.cantidad || 1),
          precio: Number(p.precio || 0),
          tipo: "venta",
          usuario,
          pedidoId: pedido.id,
          cliente,
          fechaPedido,
          timestamp: new Date().toISOString()
        }));
        await Promise.all(movimientos.map(mov =>
          addDoc(movimientosRef, mov)
        ));
      }

      setShowConfirmPopup(false);
      setConfirmIdx(null);
    } catch (err) {
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
    const data = {
      ...pedido,
      estado: "reagendar",
      fecha: nuevaFecha
    };
    delete data.metodoPago;
    await updatePedidoInTienda(selectedStore, pedido.id, data);
    setShowReagendarPopup(false);
    setReagendarIdx(null);
    setConfirmIdx(null);
  } catch (err) {
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
        localStorage.removeItem("sesion_usuario");
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

  let pedidosFiltrados = pedidosDeEstaTiendaOrdenados;
  if (filtroFecha === "pendientes") {
    pedidosFiltrados = pedidosDeEstaTiendaOrdenados.filter(
      p => p.estado === "pendiente"
    );
  } else if (filtroFecha === "cancelado") {
    pedidosFiltrados = pedidosDeEstaTiendaOrdenados.filter(
      p => p.estado === "cancelado"
    );
  } else if (
    filtroFecha &&
    filtroFecha !== "ninguna" &&
    filtroFecha !== "" &&
    filtroFecha !== "pendientes" &&
    filtroFecha !== "cancelado"
  ) {
    pedidosFiltrados = pedidosDeEstaTiendaOrdenados.filter(
      p => p.fecha === filtroFecha
    );
  } else if (filtroFecha === "ninguna") {
    pedidosFiltrados = [];
  }

  const pedidoAEditar = editingIndex !== null ? pedidosDeEstaTienda[editingIndex] : undefined;
  const isAnyPopupOpen = showPedidoModal || showConfirmPopup || showReagendarPopup;

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
          productosTienda={productosTienda}
        />
      )}
      {showConfirmPopup && (
        <ConfirmarPedidoPopup
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
        <div className="w-full flex justify-center">
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
                    maxWidth: "1600px",
                    width: "97vw",
                    minHeight: "65vh",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "2.5rem 1vw",
                    position: "relative"
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
                      width: "80%"
                    }}
                  >
                    Agregar Pedido
                  </button>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 text-left">Pedidos</h3>
                  <div className="w-full flex justify-end mb-2">
                    <Exportarexcel pedidos={pedidosDeEstaTiendaOrdenados} tienda={selectedStore} />
                  </div>
                  <div
                    className="PedidosTableContainer w-full"
                    style={{
                      width: "100%",
                      marginBottom: 22
                    }}>
                    <PedidosTable
                      pedidos={pedidosFiltrados}
                      pedidoAEditar={pedidoAEditar}
                      handleEditarPedido={handleEditarPedido}
                      handleEliminarPedido={handleEliminarPedido}
                      onShowPopupConfirmar={handleShowPopupConfirmar}
                      isAdmin={isAdmin}
                      isAnyPopupOpen={isAnyPopupOpen}
                      fechasUnicas={fechasUnicas}
                      filtroFecha={filtroFecha}
                      setFiltroFecha={setFiltroFecha}
                    />
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
                (() => {
                  return <TiendasInventario user={currentUserObj} />;
                })()
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