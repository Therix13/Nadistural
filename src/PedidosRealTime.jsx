import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export default function PedidosRealtime({ tiendaActual }) {
  const [pedidos, setPedidos] = useState([]);
  const [nuevoPedido, setNuevoPedido] = useState({
    nombre: "", telefono: "", productos: "", precio: "", fecha: "", vendedor: "", estado: "", 
    calleNumero: "", colonia: "", municipio: "", codigoPostal: "", entreCalles: "", nota: "",
  });

  // Suscripción en tiempo real a SOLO los pedidos de la tienda seleccionada
  useEffect(() => {
    if (!tiendaActual) return;
    const pedidosRef = collection(db, "tiendas", tiendaActual, "pedidos");
    const unsubscribe = onSnapshot(pedidosRef, (snapshot) => {
      const pedidosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(pedidosData);
    });
    return () => unsubscribe();
  }, [tiendaActual]);

  // Agrega pedido a la subcolección correspondiente
  const agregarPedido = async (e) => {
    e.preventDefault();
    let productosArray = [];
    if (nuevoPedido.productos.trim()) {
      productosArray = nuevoPedido.productos.split(",").map(str => {
        const [cant, producto] = str.trim().split("x").map(s => s.trim());
        return { cantidad: parseInt(cant), producto };
      });
    }

    const pedidoAEnviar = {
      ...nuevoPedido,
      productos: productosArray,
      precio: parseFloat(nuevoPedido.precio)
    };

    await addDoc(collection(db, "tiendas", tiendaActual, "pedidos"), pedidoAEnviar);

    setNuevoPedido({
      nombre: "", telefono: "", productos: "", precio: "", fecha: "", vendedor: "", estado: "",
      calleNumero: "", colonia: "", municipio: "", codigoPostal: "", entreCalles: "", nota: ""
    });
  };

  return (
    <div>
      <h2>Pedidos en tiempo real ({tiendaActual})</h2>
      <h3>Total pedidos: {pedidos.length}</h3>
      <form onSubmit={agregarPedido} style={{ marginBottom: 24 }}>
        <input type="text" placeholder="Cliente" value={nuevoPedido.nombre}
          onChange={e => setNuevoPedido(p => ({ ...p, nombre: e.target.value }))}/>
        <input type="text" placeholder="Teléfono" value={nuevoPedido.telefono}
          onChange={e => setNuevoPedido(p => ({ ...p, telefono: e.target.value }))}/>
        <input type="text" placeholder="Productos (Ej: 1x sindolflex, 2x otroprod)" value={nuevoPedido.productos}
          onChange={e => setNuevoPedido(p => ({ ...p, productos: e.target.value }))}/>
        <input type="number" placeholder="Precio" value={nuevoPedido.precio}
          onChange={e => setNuevoPedido(p => ({ ...p, precio: e.target.value }))}/>
        <input type="date" placeholder="Fecha" value={nuevoPedido.fecha}
          onChange={e => setNuevoPedido(p => ({ ...p, fecha: e.target.value }))}/>
        <input type="text" placeholder="Vendedor" value={nuevoPedido.vendedor}
          onChange={e => setNuevoPedido(p => ({ ...p, vendedor: e.target.value }))}/>
        <input type="text" placeholder="Estado" value={nuevoPedido.estado}
          onChange={e => setNuevoPedido(p => ({ ...p, estado: e.target.value }))}/>
        <input type="text" placeholder="Calle y número" value={nuevoPedido.calleNumero}
          onChange={e => setNuevoPedido(p => ({ ...p, calleNumero: e.target.value }))}/>
        <input type="text" placeholder="Colonia" value={nuevoPedido.colonia}
          onChange={e => setNuevoPedido(p => ({ ...p, colonia: e.target.value }))}/>
        <input type="text" placeholder="Municipio" value={nuevoPedido.municipio}
          onChange={e => setNuevoPedido(p => ({ ...p, municipio: e.target.value }))}/>
        <input type="text" placeholder="Código Postal" value={nuevoPedido.codigoPostal}
          onChange={e => setNuevoPedido(p => ({ ...p, codigoPostal: e.target.value }))}/>
        <input type="text" placeholder="Entre calles" value={nuevoPedido.entreCalles}
          onChange={e => setNuevoPedido(p => ({ ...p, entreCalles: e.target.value }))}/>
        <input type="text" placeholder="Nota" value={nuevoPedido.nota}
          onChange={e => setNuevoPedido(p => ({ ...p, nota: e.target.value }))}/>
        <button type="submit">Agregar pedido</button>
      </form>
      <ul>
        {pedidos.map(p => (
          <li key={p.id}>
            <b>{p.nombre}</b> - {p.fecha} - {p.telefono} - {p.productos?.map(prod => `${prod.cantidad}x ${prod.producto}`).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}