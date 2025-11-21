import React, { useState } from "react";

const menuItems = [
  { key: "inicio", label: "Inicio" },
  { key: "tiendas", label: "Tiendas" },
  { key: "inventario", label: "Inventario" },
  { key: "configuracion", label: "Configuración" },
];

export default function Navbar({ user, onLogout, onNavigate, currentView, isAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavigate(key) {
    if (onNavigate) onNavigate(key);
    setMobileOpen(false);
  }

  const availableItems = menuItems.filter(
    item =>
      isAdmin ||
      item.key !== "configuracion"
  );

  return (
    <nav
      className="w-full py-2 px-2 shadow border-b border-slate-200 fixed top-0 left-0 z-[110]"
      style={{
        background:
          "linear-gradient(90deg,#eaeaea 0%,#f5f5f5 45%,#d4d4d4 100%)"
      }}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <span className="text-gray-900 font-black text-lg md:text-xl tracking-tight select-none">Nadistural</span>
        <div className="hidden md:flex items-center gap-6">
          {availableItems.map(item => (
            <button
              key={item.key}
              className={`px-3 py-2 rounded text-base font-semibold transition ${
                currentView === item.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-blue-600 hover:text-white"
              }`}
              onClick={() => handleNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-2 text-gray-600 text-base font-semibold">{user}</span>
          <button
            className="ml-4 px-3 py-2 rounded text-base font-semibold shadow transition bg-transparent text-black hover:text-blue-700"
            style={{ minWidth: "120px" }}
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <span className="text-gray-600 text-base font-semibold mr-1">{user}</span>
          <button
            className="p-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 shadow"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1={3} y1={12} x2={21} y2={12} />
              <line x1={3} y1={6} x2={21} y2={6} />
              <line x1={3} y1={18} x2={21} y2={18} />
            </svg>
          </button>
        </div>
      </div>
      <div
        className={`md:hidden fixed top-[54px] right-0 z-[111] w-[220px] ${mobileOpen ? "translate-x-0 opacity-100" : "translate-x-[250px] opacity-0"} transition-all duration-300`}
        style={{ pointerEvents: mobileOpen ? "auto" : "none", background: "#ededed", borderLeft: "1px solid #d4d4d4", boxShadow: "0 12px 32px 0 rgba(20,20,20,0.13)", borderRadius: "0 0 18px 18px" }}
      >
        <div className="flex flex-col py-4 rounded-b-xl">
          {availableItems.map(item => (
            <button
              key={item.key}
              className={`w-full text-left px-6 py-3 text-base font-semibold transition border-b border-slate-300 last:border-none 
                ${currentView === item.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-800 hover:bg-blue-600 hover:text-white"
                }`}
              onClick={() => handleNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="w-full text-left px-6 py-3 text-base font-semibold bg-transparent text-black rounded-b-xl shadow mt-2 hover:text-blue-700"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      <style>
        {`
          @media (max-width: 900px) {
            nav { font-size: 14px }
          }
        `}
      </style>
    </nav>
  );
}