import React, { useState, useEffect } from "react";

export default function PedidoModal({ open, onClose, onSubmit, initialValues }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [productos, setProductos] = useState([{ producto: "", cantidad: 1 }]);
  const [precio, setPrecio] = useState("");
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState("");
  const [calleNumero, setCalleNumero] = useState("");
  const [colonia, setColonia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setNombre(initialValues.nombre || "");
      setTelefono(initialValues.telefono || "");
      setProductos(
        Array.isArray(initialValues.productos) && initialValues.productos.length > 0
          ? initialValues.productos.map((p) => ({ ...p }))
          : [{ producto: "", cantidad: 1 }]
      );
      setPrecio(initialValues.precio || "");
      setNota(initialValues.nota || "");
      setFecha(initialValues.fecha || "");
      setCalleNumero(initialValues.calleNumero || "");
      setColonia(initialValues.colonia || "");
      setMunicipio(initialValues.municipio || "");
      setCodigoPostal(initialValues.codigoPostal || "");
      setError("");
    } else {
      setNombre("");
      setTelefono("");
      setProductos([{ producto: "", cantidad: 1 }]);
      setPrecio("");
      setNota("");
      setFecha("");
      setCalleNumero("");
      setColonia("");
      setMunicipio("");
      setCodigoPostal("");
      setError("");
    }
  }, [initialValues, open]);

  if (!open) return null;

  const handleAddProducto = () => {
    setProductos([...productos, { producto: "", cantidad: 1 }]);
  };

  const handleRemoveProducto = (idx) => {
    setProductos(productos.filter((_, i) => i !== idx));
  };

  const handleProductoChange = (idx, field, value) => {
    setProductos((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: field === "cantidad" ? Number(value) : value } : p
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const nuevoPedido = {
      nombre: nombre,
      calleNumero: calleNumero,
      colonia: colonia,
      municipio: municipio,
      codigoPostal: codigoPostal,
      telefono: telefono,
      productos: productos,
      precio: precio,
      nota: nota,
      fecha: fecha
    };
    onSubmit(nuevoPedido);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full mx-auto flex flex-col items-center animate-fadein"
          style={{
            maxHeight: "95vh",
            overflowY: "auto",
            width: "95vw",
            minWidth: "280px"
          }}
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {initialValues ? "Editar pedido" : "Nuevo pedido"}
          </h2>
          <form
            className="w-full flex flex-col items-center gap-3"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <label className="flex flex-col w-full gap-1">
              <span className="text-sm text-slate-600 font-semibold">Cliente</span>
              <input
                className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600 font-semibold">Calle y Número</span>
                <input
                  className="h-10 px-3 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                  value={calleNumero}
                  onChange={(e) => setCalleNumero(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600 font-semibold">Colonia</span>
                <input
                  className="h-10 px-3 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600 font-semibold">Municipio</span>
                <input
                  className="h-10 px-3 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600 font-semibold">Código Postal</span>
                <input
                  className="h-10 px-3 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                />
              </label>
            </div>
            <label className="flex flex-col w-full gap-1">
              <span className="text-sm text-slate-600 font-semibold">Teléfono</span>
              <input
                className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </label>
            <div className="w-full">
              <span className="text-sm text-slate-600 font-semibold">Productos</span>
              {productos.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center mt-2 w-full">
                  <input
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                    placeholder="Producto"
                    value={p.producto}
                    onChange={(e) =>
                      handleProductoChange(idx, "producto", e.target.value)
                    }
                  />
                  <input
                    className="w-20 h-10 px-2 rounded-lg border border-slate-300 shadow-sm focus:outline-none text-center"
                    type="number"
                    min={1}
                    value={p.cantidad}
                    onChange={(e) =>
                      handleProductoChange(idx, "cantidad", e.target.value)
                    }
                  />
                  {productos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProducto(idx)}
                      className="px-2 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                      title="Eliminar producto"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddProducto}
                className="mt-2 px-3 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition w-full"
              >
                + Agregar producto
              </button>
            </div>
            <label className="flex flex-col w-full gap-1">
              <span className="text-sm text-slate-600 font-semibold">Precio</span>
              <input
                className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                type="number"
                min={0}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </label>
            <label className="flex flex-col w-full gap-1">
              <span className="text-sm text-slate-600 font-semibold">Nota</span>
              <input
                className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </label>
            <label className="flex flex-col w-full gap-1">
              <span className="text-sm text-slate-600 font-semibold">Fecha de entrega</span>
              <input
                className="w-full h-10 px-4 rounded-lg border border-slate-300 shadow-sm focus:outline-none"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>
            {error && (
              <p className="text-base text-rose-600 font-semibold">{error}</p>
            )}
            <div className="flex w-full gap-4 mt-2">
              <button
                type="button"
                className="w-full px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition"
              >
                {initialValues ? "Guardar cambios" : "Agregar pedido"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}