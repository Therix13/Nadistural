import React, { useState, useEffect } from "react";
import PedidoModal from "./PedidoModal";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export default function PedidosTienda({ tienda }) {
  const [openPedidoModal, setOpenPedidoModal] = useState(false);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    async function cargarProductos() {
      if (!tienda?.name) return;
      const db = getFirestore();
      const ref = collection(db, "Inventario", tienda.name, "PRODUCTOS");
      const snap = await getDocs(ref);
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    cargarProductos();
  }, [tienda]);

  return (
    <div className="p-6 bg-white rounded-2xl max-w-md mx-auto shadow-2xl" style={{ marginTop: "64px" }}>
      <button
        className="mb-2 text-slate-600 hover:text-slate-900"
        onClick={() => {}}
      >
        <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2.3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="text-center mb-4">
        <div className="font-extrabold text-lg">
          <span className="font-medium text-[#222]">Tienda: </span>
          <span className="font-bold">{tienda?.name}</span>
        </div>
        <div className="text-slate-500 text-base">Has entrado a {tienda?.name}.</div>
      </div>
      <button
        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow transition mb-4"
        onClick={() => setOpenPedidoModal(true)}
      >
        Agregar Pedido
      </button>
      <div className="font-semibold text-slate-800 mb-2 mt-1 text-center">Pedidos</div>
      <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 float-right">
        Exportar
      </button>
      <PedidoModal
        open={openPedidoModal}
        onClose={() => setOpenPedidoModal(false)}
        onSubmit={() => {}}
        productosTienda={productos}
      />
    </div>
  );
}