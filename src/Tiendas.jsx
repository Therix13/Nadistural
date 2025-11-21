import React, { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

function getFechaAgendadaManiana() {
  const today = new Date();
  let targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 1);
  if (today.getDay() === 6) targetDate.setDate(today.getDate() + 2);
  const yyyy = targetDate.getFullYear();
  const mm = `${targetDate.getMonth() + 1}`.padStart(2, "0");
  const dd = `${targetDate.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Tiendas({ stores, onSelectStore, isAdmin }) {
  const [pedidosCounts, setPedidosCounts] = useState({});
  const [deliveryLabel, setDeliveryLabel] = useState("Pedidos para mañana");
  useEffect(() => {
    const today = new Date();
    let label = "Pedidos para mañana";
    if (today.getDay() === 6) label = "Pedidos para el Lunes";
    setDeliveryLabel(label);
    const unsubscribes = [];
    function subscribeRealtime() {
      const db = getFirestore();
      const fechaAgendada = getFechaAgendadaManiana();
      stores.forEach(store => {
        const ref = collection(db, "tiendas", store, "pedidos");
        const unsubscribe = onSnapshot(ref, snap => {
          let count = 0;
          snap.forEach(doc => {
            const data = doc.data();
            if (data.fecha === fechaAgendada) count++;
          });
          setPedidosCounts(prev => ({ ...prev, [store]: count }));
        });
        unsubscribes.push(unsubscribe);
      });
    }
    if (isAdmin && stores.length > 0) subscribeRealtime();
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [stores, isAdmin]);
  return (
    <section
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 flex flex-col items-center justify-start text-center w-full mx-auto"
      style={{
        maxWidth: 500,
        minHeight: "60vh"
      }}
    >
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Tiendas</h2>
      <div className="flex flex-col w-full gap-6 items-center">
        {stores.map(store => (
          <div
            key={store}
            className="bg-slate-50 shadow border px-6 py-5 rounded-xl flex flex-col items-center justify-center w-full"
            style={{
              minWidth: 220,
              maxWidth: 360,
              margin: "0 auto",
              border: "1.5px solid #262626",
            }}
          >
            <span className="font-bold text-lg mb-1 mt-1">{store}</span>
            {isAdmin && (
              <span className="text-base text-slate-700 mb-3">
                {deliveryLabel}: <b>{pedidosCounts[store] ?? 0}</b>
              </span>
            )}
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                style={{ width: "90%", minWidth: 120, maxWidth: 220 }}
                onClick={() => onSelectStore(store)}
              >
                Ver pedidos
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>
        {`
          @media (max-width: 550px) {
            section {
              max-width: 98vw !important;
              padding-left: 4vw !important;
              padding-right: 4vw !important;
            }
            .bg-slate-50 {
              min-width: 80vw !important;
              max-width: 98vw !important;
            }
            .btn-ver-pedidos {
              min-width: 100px !important;
            }
          }
        `}
      </style>
    </section>
  );
}