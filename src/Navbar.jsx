import React from "react";

export default function Navbar({
  user,
  onLogout,
  onNavigate,
  currentView,
  isAdmin = false,
}) {
  return (
    <nav className="w-full bg-white border-b border-slate-300 shadow flex items-center justify-between px-5 py-3 z-30">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-blue-700 tracking-wide">
          Nadistural
        </span>
        <span className="hidden md:inline-block px-2 py-1 text-sm bg-slate-100 rounded text-slate-600 font-semibold ml-2">
          Sistema de pedidos
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded text-slate-700 font-semibold hover:bg-blue-50 transition ${
            currentView === "inicio" ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={() => onNavigate("inicio")}
        >
          Inicio
        </button>
        <button
          className={`px-3 py-1 rounded text-slate-700 font-semibold hover:bg-blue-50 transition ${
            currentView === "tiendas" ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={() => onNavigate("tiendas")}
        >
          Tiendas
        </button>
        <button
          className={`px-3 py-1 rounded text-slate-700 font-semibold hover:bg-blue-50 transition ${
            currentView === "inventario" ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={() => onNavigate("inventario")}
        >
          Inventario
        </button>
        {isAdmin && (
          <button
            className={`px-3 py-1 rounded text-slate-700 font-semibold hover:bg-blue-50 transition ${
              currentView === "configuracion" ? "bg-blue-100 text-blue-700" : ""
            }`}
            onClick={() => onNavigate("configuracion")}
          >
            Configuración
          </button>
        )}
        <span className="mx-2 text-slate-400 font-bold select-none">|</span>
        <span className="text-blue-700 font-semibold">{user}</span>
        <button
          className="ml-2 px-3 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}