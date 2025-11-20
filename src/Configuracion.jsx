import React, { useState } from "react";

const ZoomDeleteIcon = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center justify-center px-2"
    style={{ lineHeight: 1 }}
    title="Eliminar"
  >
    <svg
      className="w-6 h-6 text-rose-600 transition-transform duration-200 group-hover:scale-125"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
);

export default function Configuracion({
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  stores = [],
  onAddStore,
  onDeleteStore,
  users = [],
  currentUser,
}) {
  // ... estado y handlers para añadir/editar usuarios y tiendas ...

  // Estado para nuevo usuario
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  const [selectedStores, setSelectedStores] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Nueva tienda
  const [newStore, setNewStore] = useState("");
  const [storeMsg, setStoreMsg] = useState("");

  const isAdmin = currentUser === "admin";

  const toggleStore = (s) => {
    setSelectedStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!nombre.trim() || !password.trim()) {
      setError("Completa nombre y contraseña.");
      return;
    }
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    const newUser = {
      nombre: nombre.trim(),
      password,
      rol,
      stores: selectedStores,
    };
    if (onAddUser) onAddUser(newUser);
    setSuccess("Usuario añadido exitosamente.");
    setNombre("");
    setPassword("");
    setRol("usuario");
    setSelectedStores([]);
  };

  const handleAddStore = (e) => {
    e.preventDefault();
    setStoreMsg("");
    const s = (newStore || "").trim();
    if (!s) {
      setStoreMsg("Ingresa el nombre de la tienda.");
      return;
    }
    if (onAddStore) onAddStore(s);
    setStoreMsg("Tienda añadida.");
    setNewStore("");
  };

  // Edición completa
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingOriginalNombre, setEditingOriginalNombre] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRol, setEditRol] = useState("usuario");
  const [editStores, setEditStores] = useState([]);
  const [editMsg, setEditMsg] = useState("");

  const startEdit = (u) => {
    setEditingUserId(u.id || null);
    setEditingOriginalNombre(u.nombre);
    setEditNombre(u.nombre);
    setEditPassword("");
    setEditRol(u.rol || "usuario");
    setEditStores(u.stores ? [...u.stores] : []);
    setEditMsg("");
  };

  const toggleEditingStore = (s) => {
    setEditStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const saveEdit = () => {
    if (!editingOriginalNombre && !editingUserId) return;
    if (!editNombre.trim()) {
      setEditMsg("El nombre no puede estar vacío.");
      return;
    }
    if (editPassword && editPassword.length < 4) {
      setEditMsg("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    const updated = {
      nombre: editNombre.trim(),
      password: editPassword === "" ? undefined : editPassword,
      rol: editRol,
      stores: editStores,
    };

    if (editingUserId) {
      onUpdateUser({ id: editingUserId, ...updated });
    } else {
      onUpdateUser({ originalNombre: editingOriginalNombre, ...updated });
    }

    setEditingUserId(null);
    setEditingOriginalNombre(null);
    setEditNombre("");
    setEditPassword("");
    setEditRol("usuario");
    setEditStores([]);
    setEditMsg("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingOriginalNombre(null);
    setEditNombre("");
    setEditPassword("");
    setEditRol("usuario");
    setEditStores([]);
    setEditMsg("");
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full flex flex-col md:flex-row gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 w-full md:w-1/2 text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Añadir nuevo usuario</h2>
          <form onSubmit={handleSubmitUser} className="w-full flex flex-col items-center gap-3" autoComplete="off">
            <label className="flex flex-col w-full max-w-md gap-2 items-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-center">Nombre</span>
              <input
                className="w-full h-12 px-4 rounded-xl bg-white border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 text-slate-900 text-center shadow-sm"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label className="flex flex-col w-full max-w-md gap-2 items-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-center">Contraseña</span>
              <input
                className="w-full h-12 px-4 rounded-xl bg-white border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 text-slate-900 text-center shadow-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col w-full max-w-md gap-2 items-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-center">Rol</span>
              <select
                className="w-full h-12 px-4 rounded-xl bg-white border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 text-slate-900 shadow-sm text-center font-semibold"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <div className="w-full max-w-md text-left">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Permisos por tienda</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {stores.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay tiendas disponibles.</div>
                ) : (
                  stores.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStore(s)}
                      className={`text-sm px-3 py-2 rounded-lg border ${selectedStores.includes(s) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-800"} w-full text-left`}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>
            {(error || success) && (
              <p className={`min-h-[1.25rem] text-sm font-semibold text-center ${error ? "text-rose-600" : "text-blue-600"}`}>
                {error || success}
              </p>
            )}
            <div className="flex justify-center w-full max-w-md">
              <button
                type="submit"
                className="w-full px-4 py-2 h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition"
              >
                Añadir usuario
              </button>
            </div>
          </form>
        </section>
        <section className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 w-full md:w-1/2">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 text-center">Tiendas disponibles</h3>
          <ul className="flex flex-col gap-2 mb-4">
            {stores.length === 0 ? (
              <li className="text-sm text-slate-500 text-center">No hay tiendas registradas.</li>
            ) : (
              stores.map((s) => (
                <li key={s} className="bg-slate-50 border border-slate-100 rounded-md px-4 py-2 text-slate-800 font-medium flex items-center justify-between">
                  <span>{s}</span>
                  {onDeleteStore && (
                    <ZoomDeleteIcon onClick={() => onDeleteStore(s)} />
                  )}
                </li>
              ))
            )}
          </ul>
          {isAdmin ? (
            <form onSubmit={handleAddStore} className="flex flex-col items-center gap-3">
              <label className="w-full max-w-md flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Nueva tienda</span>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-white border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 text-slate-900 text-center shadow-sm"
                  type="text"
                  value={newStore}
                  onChange={(e) => setNewStore(e.target.value)}
                  placeholder="Nombre de la tienda"
                />
              </label>
              {storeMsg && (
                <p className="text-sm text-blue-600 font-semibold">{storeMsg}</p>
              )}
              <div className="w-full max-w-md">
                <button
                  type="submit"
                  className="w-full px-4 py-2 h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition"
                >
                  Añadir tienda
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500 text-center">Solo administradores pueden añadir nuevas tiendas.</p>
          )}
        </section>
      </div>
      <section className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 w-full max-w-4xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 text-center">Usuarios</h3>
        {users.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mb-4">No hay usuarios creados.</p>
        ) : (
          <ul className="flex flex-col gap-3 mb-4">
            {users.map((u) => (
              <li key={u.id ?? u.nombre} className="border border-slate-100 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-slate-800 font-medium">
                      {u.nombre} {u.rol === "admin" && <span className="text-xs text-blue-600 font-semibold ml-2">(admin)</span>}
                    </div>
                    <div className="text-sm text-slate-500">Tiendas: {u.stores && u.stores.length ? u.stores.join(", ") : "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    {onDeleteUser && (
                      <ZoomDeleteIcon
                        onClick={() => onDeleteUser(u.id)}
                      />
                    )}
                  </div>
                </div>
                {editingUserId === u.id || editingOriginalNombre === u.nombre ? (
                  <div className="mt-2 border-t pt-2">
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Nombre</span>
                        <input
                          className="h-10 px-3 rounded-md border border-slate-200"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Contraseña (dejar vacío para no cambiar)</span>
                        <input
                          className="h-10 px-3 rounded-md border border-slate-200"
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Nueva contraseña"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Rol</span>
                        <select
                          className="h-10 px-3 rounded-md border border-slate-200"
                          value={editRol}
                          onChange={(e) => setEditRol(e.target.value)}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </label>
                      <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase">Permisos por tienda</span>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {stores.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleEditingStore(s)}
                              className={`text-sm px-3 py-2 rounded-lg border ${editStores.includes(s) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-800"} w-full text-left`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {editMsg && <div className="text-sm text-rose-600 mb-2">{editMsg}</div>}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-md bg-slate-50 text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="px-3 py-1.5 rounded-md bg-gradient-to-b from-blue-500 to-blue-600 text-white"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}