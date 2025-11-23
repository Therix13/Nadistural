import React, { useEffect, useState } from "react";
import { getTiendas } from "./firebase";
import Inventario from "./Inventario";

export default function TiendasInventario({ user }) {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupTienda, setPopupTienda] = useState(null);

  useEffect(() => {
    async function cargarTiendas() {
      setLoading(true);
      const todas = await getTiendas();
      let disponibles = todas || [];
      if (user && user.tiendas && Array.isArray(user.tiendas)) {
        disponibles = disponibles.filter(t => user.tiendas.includes(t.id));
      }
      setTiendas(disponibles);
      setLoading(false);
    }
    cargarTiendas();
  }, [user]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-[#151e2d] to-[#192235]">
      <div className="w-full max-w-2xl mx-auto py-10 px-3 flex flex-col items-center">
        <h2
          className="text-3xl font-extrabold mb-10 text-center text-white tracking-wide drop-shadow"
          style={{ letterSpacing: ".03em" }}
        >
          Inventarios
        </h2>
        {loading ? (
          <div className="text-center text-gray-400 bg-white/20 rounded-xl px-5 py-3 text-lg shadow-md">
            Cargando...
          </div>
        ) : tiendas.length === 0 ? (
          <div className="text-center text-gray-500 bg-white/20 rounded-xl px-5 py-3 shadow-md">
            No tienes acceso a ningún inventario
          </div>
        ) : (
          <ul className="w-full flex flex-col gap-4">
            {tiendas.map((tienda) => (
              <li
                key={tienda.id}
                className="w-full bg-white/90 transition shadow-lg rounded-xl px-6 py-4 flex items-center justify-between border-2 border-transparent hover:border-blue-400 min-h-[56px]"
                style={{ boxShadow: "0px 4px 16px 0px rgba(32,47,80,0.08)" }}
              >
                <span className="text-lg font-semibold text-[#273047]">
                  {tienda.name}
                </span>
                <button
                  className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all duration-150"
                  onClick={() => setPopupTienda(tienda)}
                >
                  Ver Inventario
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Inventario
        open={!!popupTienda}
        onClose={() => setPopupTienda(null)}
        tienda={popupTienda}
        user={user}
      />
    </div>
  );
}