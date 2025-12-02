import React, { useState } from "react";

const menuItems = [
  { key: "inicio", label: "Inicio" },
  { key: "tiendas", label: "Tiendas" },
  { key: "inventario", label: "Inventario" },
  { key: "configuracion", label: "Configuración" },
];

export default function Navbar({ user, onLogout, onNavigate, currentView, isAdmin }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleNavigate(key) {
    if (onNavigate) onNavigate(key);
    setSidebarOpen(false);
  }

  const availableItems = menuItems.filter(
    item => isAdmin || item.key !== "configuracion"
  );

  function handleLogoutModalOpen() {
    setShowLogoutConfirm(true);
    setSidebarOpen(false);
  }

  function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    onLogout();
  }

  function handleLogoutCancel() {
    setShowLogoutConfirm(false);
  }

  return (
    <>
      <button
        className="fixed top-4 left-4 z-[201] p-2 bg-gray-300 rounded-lg shadow hover:bg-gray-400 transition"
        aria-label="Abrir menú"
        onClick={() => setSidebarOpen(true)}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1={3} y1={12} x2={21} y2={12} />
          <line x1={3} y1={6} x2={21} y2={6} />
          <line x1={3} y1={18} x2={21} y2={18} />
        </svg>
      </button>

      <div>
        <div
          className={`fixed left-0 top-0 h-full w-[85vw] max-w-xs z-[210] bg-gradient-to-b from-[#eaeaea] via-[#f5f5f5] to-[#d4d4d4] shadow-2xl transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300`}
          style={{ borderRight: "1.5px solid #d4d4d4" }}
        >
          <div className="flex items-center h-16 px-4 border-b border-slate-200 justify-between">
            <span className="text-gray-900 font-black text-xl tracking-tight select-none">Nadistural</span>
            <button
              className="p-2 rounded shadow hover:bg-gray-200"
              aria-label="Cerrar menú"
              onClick={() => setSidebarOpen(false)}
            >
              <svg width={28} height={28} viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12m0-12L4 16" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-4 pt-7 pb-12">
            {availableItems.map(item => (
              <button
                key={item.key}
                className={`w-full text-left px-4 py-3 my-1 rounded transition font-semibold text-base 
                  ${currentView === item.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-800 hover:bg-blue-600 hover:text-white"
                  }`}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
            <span className="mt-8 ml-2 text-gray-600 font-bold">{user}</span>
            <button
              className="w-full text-left px-4 py-3 rounded font-semibold border text-red-700 mt-6 
              hover:text-white hover:bg-red-700 transition bg-white"
              onClick={handleLogoutModalOpen}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[200] bg-black/40"
            aria-hidden="true"
            style={{ transition: "background 0.3s" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            aria-hidden="true"
            style={{ background: "linear-gradient(180deg, #111a2b 0%, #162032 100%)", opacity: 0.9 }}
          />
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center pt-[70px]"
            style={{ pointerEvents: "auto" }}
          >
            <div className="bg-white rounded-xl px-6 py-8 shadow-lg max-w-xs w-full flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-5 text-gray-800 text-center">
                ¿Seguro que deseas cerrar sesión?
              </h3>
              <div className="flex gap-4 w-full justify-center mt-2">
                <button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 rounded py-2 font-bold"
                  onClick={handleLogoutCancel}
                >
                  No
                </button>
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-2 font-bold"
                  onClick={handleLogoutConfirm}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}