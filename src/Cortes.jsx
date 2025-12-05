import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";

function agruparEnviosPorPrecio(movs, tipo) {
  const map = {};
  movs.filter(m => m.metodoPago === tipo).forEach(m => {
    const px = Number(m.precioVenta || 0);
    map[px] = (map[px] || 0) + 1;
  });
  return Object.entries(map).map(([precio, cantidad]) => ({
    precio: Number(precio),
    cantidad
  }));
}

export default function Cortes({ open, onClose, tienda }) {
  const [showCortesList, setShowCortesList] = useState(false);
  const [showAgregarCorte, setShowAgregarCorte] = useState(false);
  const [fechaCorte, setFechaCorte] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repartidor, setRepartidor] = useState("");
  const [totalRepartidor, setTotalRepartidor] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [corteYaGuardado, setCorteYaGuardado] = useState(false);
  const [cortesGuardados, setCortesGuardados] = useState([]);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    async function load() {
      if (!tienda || !showAgregarCorte) return;
      setLoading(true);
      const db = getFirestore();
      const movRef = collection(db, "Inventario", tienda.name, "MOVIMIENTOS");
      const snap = await getDocs(movRef);
      const datos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMovimientos(datos);
      setLoading(false);
    }
    load();
  }, [tienda, showAgregarCorte]);

  useEffect(() => {
    async function checkIfCorteExists() {
      setSaveSuccess(null);
      setCorteYaGuardado(false);
      if (!fechaCorte || !tienda?.name) return;
      const db = getFirestore();
      const docRef = doc(db, "Cortes", tienda.name, "cortes", fechaCorte);
      const corteSnap = await getDoc(docRef);
      setCorteYaGuardado(corteSnap.exists());
    }
    checkIfCorteExists();
  }, [fechaCorte, tienda]);

  useEffect(() => {
    async function loadCortesGuardados() {
      if (!showCortesList || !tienda?.name) {
        setCortesGuardados([]);
        return;
      }
      setLoadingCortes(true);
      try {
        const db = getFirestore();
        const cortesColRef = collection(db, "Cortes", tienda.name, "cortes");
        const cortesSnap = await getDocs(cortesColRef);
        const allCortes = cortesSnap.docs.map(docx => ({ fecha: docx.id, ...docx.data() }));
        allCortes.sort((a, b) => b.fecha.localeCompare(a.fecha));
        setCortesGuardados(allCortes);
      } catch (e) {
        setCortesGuardados([]);
      }
      setLoadingCortes(false);
    }
    loadCortesGuardados();
  }, [showCortesList, tienda]);

  const movimientosFiltrados = movimientos.filter(
    m =>
      m.fechaPedido &&
      fechaCorte &&
      m.fechaPedido === fechaCorte &&
      m.metodoPago &&
      (m.metodoPago === "Efectivo" || m.metodoPago === "Transferencia")
  );

  const enviosEfectivo = agruparEnviosPorPrecio(movimientosFiltrados, "Efectivo");
  const enviosTransfer = agruparEnviosPorPrecio(movimientosFiltrados, "Transferencia");

  const sbt_ct = movimientosFiltrados.reduce((sum, m) => sum + Number(m.precioVenta || 0), 0);
  const sbt_st = movimientosFiltrados
    .filter(m => m.metodoPago === "Efectivo")
    .reduce((sum, m) => sum + Number(m.precioVenta || 0), 0);

  const totalEnvios = movimientosFiltrados.length;

  useEffect(() => {
    const ganancia = Number(repartidor) || 0;
    setTotalRepartidor(totalEnvios * ganancia);
  }, [repartidor, totalEnvios]);

  const totalAPagar = sbt_st - totalRepartidor;

  async function handleGuardarCorte() {
    if (!fechaCorte || !tienda?.name) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const db = getFirestore();
      const ruta = doc(db, "Cortes", tienda.name, "cortes", fechaCorte);
      await setDoc(ruta, {
        tienda: tienda.name,
        fecha: fechaCorte,
        enviosEfectivo,
        enviosTransfer,
        sbt_ct,
        sbt_st,
        totalEnvios,
        repartidor: Number(repartidor) || 0,
        totalRepartidor,
        totalAPagar,
        guardadoEn: new Date().toISOString()
      });
      setSaveSuccess(true);
      setCorteYaGuardado(true);
    } catch (e) {
      setSaveSuccess(false);
    }
    setSaving(false);
  }

  const fechasConCorte = cortesGuardados.map(c => c.fecha);

  function renderCalendarioFechasCorte() {
    if (!cortesGuardados.length) return null;
    return (
      <div className="mb-4">
        <label className="text-sm text-gray-600 mb-2 block">Filtrar por fecha:</label>
        <input
          type="date"
          value={filtroFecha}
          onChange={e=>setFiltroFecha(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
        />
        <div className="flex flex-wrap mt-2 gap-2">
          {cortesGuardados
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map(corte => (
              <button
                key={corte.fecha}
                className={`px-2 py-1 rounded font-semibold text-xs transition-colors ${
                  filtroFecha === corte.fecha
                    ? "bg-green-800 text-white"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                onClick={()=>setFiltroFecha(corte.fecha)}
              >
                {corte.fecha}
              </button>
            ))
          }
        </div>
        {filtroFecha && !fechasConCorte.includes(filtroFecha) && (
          <div className="mt-2 text-red-600 text-xs">No hay corte guardado en {filtroFecha}</div>
        )}
        {filtroFecha && (
          <button
            className="mt-2 ml-2 px-2 py-1 rounded bg-gray-300 text-gray-900 text-xs"
            onClick={()=>setFiltroFecha("")}
          >Ver todos</button>
        )}
      </div>
    );
  }

  const cortesMostrar = filtroFecha
    ? cortesGuardados.filter(c => c.fecha === filtroFecha)
    : cortesGuardados;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/40 px-2 pt-6 pb-6 overflow-y-auto">
      <div
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-xl mx-auto flex flex-col justify-between"
        style={{
          minHeight: "min(660px,88vh)",
          maxHeight: "min(720px,96vh)",
          marginTop: "2rem",
          marginBottom: "2rem",
          boxSizing: "border-box",
          display: "flex"
        }}
      >
        <div className="flex flex-col gap-4 px-4 pt-8 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">CORTES</h2>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              className={`px-4 py-2 rounded-md font-semibold shadow transition-colors text-sm ${showAgregarCorte ? "bg-green-700 text-white" : "bg-green-600 text-white"}`}
              onClick={() => { setShowAgregarCorte(true); setShowCortesList(false); setSaveSuccess(null); setFiltroFecha(""); }}
            >
              Agregar nuevo corte
            </button>
            <button
              className={`px-4 py-2 rounded-md font-semibold shadow transition-colors text-sm ${showCortesList ? "bg-blue-700 text-white":"bg-blue-600 text-white"}`}
              onClick={() => { setShowCortesList(true); setShowAgregarCorte(false); setSaveSuccess(null); }}
            >
              Ver cortes
            </button>
          </div>
        </div>
        <div className="flex-1 w-full px-3 pb-3 pt-3 overflow-y-auto"
             style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 340 }}>
          {showAgregarCorte && (
            <div className="w-full flex flex-col items-center max-w-lg mx-auto">
              <h3 className="text-lg font-bold mb-2 text-center">Agregar corte</h3>
              <label className="mb-2 text-sm font-medium text-gray-700 text-center">Fecha del corte:</label>
              <input
                type="date"
                value={fechaCorte}
                onChange={e => setFechaCorte(e.target.value)}
                className="input border rounded px-2 py-1 mb-4 w-full max-w-xs"
              />
              {!fechaCorte ? (
                <div className="text-gray-500 text-sm mt-4 text-center">Selecciona la fecha del corte</div>
              ) : loading ? (
                <div className="text-gray-500 text-sm mt-4 text-center">Cargando movimientos...</div>
              ) : (
                <div className="w-full flex flex-col items-center mt-2 gap-2">
                  <div className="w-full bg-gray-50 p-3 rounded-lg shadow-sm mb-3">
                    <div className="mb-2 font-bold text-gray-800">Efectivo:</div>
                    {enviosEfectivo.length === 0 ? (
                      <div className="text-gray-500">Sin envíos en efectivo.</div>
                    ) : (
                      enviosEfectivo.map((item,i) => (
                        <div key={i} className="flex gap-2 items-center text-sm">
                          <span>{item.cantidad} envíos x {item.precio.toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                          <span>=</span>
                          <b>{(item.cantidad*item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</b>
                        </div>
                      ))
                    )}
                    <div className="mt-4 font-bold text-blue-800">Transferencia:</div>
                    {enviosTransfer.length === 0 ? (
                      <div className="text-gray-500">Sin envíos por transferencia.</div>
                    ) : (
                      enviosTransfer.map((item,i) => (
                        <div key={i} className="flex gap-2 items-center text-sm">
                          <span>{item.cantidad} envíos x {item.precio.toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                          <span>=</span>
                          <b>{(item.cantidad*item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</b>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="w-full flex flex-col gap-1 mb-2">
                    <div className="flex justify-between font-semibold bg-slate-100 rounded p-2 mt-1">
                      <span>SBT C/T:</span>
                      <span>{sbt_ct.toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                    </div>
                    <div className="flex justify-between font-semibold bg-slate-100 rounded p-2 mt-1">
                      <span>SBT S/T:</span>
                      <span>{sbt_st.toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                    </div>
                  </div>
                  <div className="mt-2 w-full flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Cobro por entrega del repartidor:
                    </label>
                    <div className="flex gap-2 w-full">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={repartidor}
                        onChange={e => setRepartidor(e.target.value)}
                        className="input border rounded px-3 py-1 w-24 sm:w-32"
                        placeholder="Monto"
                        disabled={corteYaGuardado}
                      />
                      <span className="self-center text-sm text-gray-600">
                        x {totalEnvios} entregas =
                        <b className="ml-1 text-green-700">
                          {totalRepartidor.toLocaleString("es-MX", { style:"currency", currency:"MXN" })}
                        </b>
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full">
                    <div className="flex justify-between font-bold bg-gray-200 text-black rounded p-2 mt-1">
                      <span>Total a pagar:</span>
                      <span>
                        { (sbt_st-totalRepartidor).toLocaleString("es-MX", { style:"currency", currency:"MXN" })}
                      </span>
                    </div>
                  </div>
                  {!corteYaGuardado && (
                    <button
                      className="mt-6 px-6 py-2 rounded-md bg-green-700 hover:bg-green-800 text-white text-base font-semibold shadow w-full max-w-xs"
                      onClick={handleGuardarCorte}
                      disabled={saving || !fechaCorte || !tienda?.name}
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  )}
                  {corteYaGuardado && (
                    <div className="mt-6 px-6 py-2 rounded-md bg-gray-300 text-gray-800 text-base font-semibold shadow w-full max-w-xs text-center">
                      Corte guardado. No es posible modificar.
                    </div>
                  )}
                  {saveSuccess === true && (
                    <div className="text-green-700 mt-2 text-sm font-semibold text-center">¡Corte guardado correctamente!</div>
                  )}
                  {saveSuccess === false && (
                    <div className="text-red-700 mt-2 text-sm font-semibold text-center">Error al guardar. Intenta de nuevo.</div>
                  )}
                </div>
              )}
            </div>
          )}
          {showCortesList && (
            <div className="w-full flex flex-col items-center max-w-lg mx-auto pb-3">
              <h3 className="text-lg font-bold mb-2 text-center">Listado de cortes</h3>
              {renderCalendarioFechasCorte()}
              {loadingCortes ? (
                <div className="text-gray-500 text-sm">Cargando cortes guardados...</div>
              ) : cortesMostrar.length === 0 ? (
                <div className="text-gray-500 text-sm">No hay cortes guardados para esta tienda.</div>
              ) : (
                <div className="w-full max-h-96 overflow-y-auto space-y-4">
                  {cortesMostrar.map((corte, idx) => (
                    <div key={corte.fecha || idx} className="border p-3 rounded-lg shadow-sm bg-gray-50">
                      <div className="font-semibold text-blue-800 text-lg mb-1">Fecha: {corte.fecha}</div>
                      <div className="text-sm space-y-1">
                        <div>Efectivo:</div>
                        {Array.isArray(corte.enviosEfectivo) && corte.enviosEfectivo.length > 0 ? (
                          corte.enviosEfectivo.map((item, i) => (
                            <div key={i} className="flex gap-1 items-center ml-2">
                              <span>{item.cantidad} envíos x </span>
                              <span>{Number(item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                              <span>= <b>{(item.cantidad*item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</b></span>
                            </div>
                          ))
                        ) : (
                          <div className="ml-2 text-gray-500">Sin envíos en efectivo</div>
                        )}
                        <div className="mt-2">Transferencia:</div>
                        {Array.isArray(corte.enviosTransfer) && corte.enviosTransfer.length > 0 ? (
                          corte.enviosTransfer.map((item, i) => (
                            <div key={i} className="flex gap-1 items-center ml-2">
                              <span>{item.cantidad} envíos x </span>
                              <span>{Number(item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                              <span>= <b>{(item.cantidad*item.precio).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</b></span>
                            </div>
                          ))
                        ) : (
                          <div className="ml-2 text-gray-500">Sin envíos por transferencia</div>
                        )}
                        <div className="mt-2 flex justify-between bg-slate-100 px-2 py-1 rounded font-semibold">
                          <span>SBT C/T:</span>
                          <span>{Number(corte.sbt_ct || 0).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                        </div>
                        <div className="flex justify-between bg-slate-100 px-2 py-1 rounded font-semibold">
                          <span>SBT S/T:</span>
                          <span>{Number(corte.sbt_st || 0).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}</span>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span className="mr-2">Cobro repartidor:</span>
                          <span>
                            {Number(corte.repartidor || 0).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}
                            &nbsp;x&nbsp;{Number(corte.totalEnvios || 0)} entregas = 
                            <b className="ml-1 text-green-700">
                              {Number(corte.totalRepartidor || 0).toLocaleString("es-MX", {style:"currency", currency:"MXN"})}
                            </b>
                          </span>
                        </div>
                        <div className="flex justify-between mt-2 font-bold bg-gray-200 text-black rounded p-2">
                          <span>Total a pagar:</span>
                          <span>
                            {Number(corte.totalAPagar||0).toLocaleString("es-MX", { style:"currency", currency:"MXN" })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Guardado: {corte.guardadoEn ? new Date(corte.guardadoEn).toLocaleString() : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="pt-4 pb-3 px-4 border-t border-gray-200 w-full flex justify-center">
          <button
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold w-full max-w-xs"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}