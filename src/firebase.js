import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoeBO3Kker789VNFlArjCPFUFYUMuZ9Lw",
  authDomain: "usuarios-nadistural.firebaseapp.com",
  projectId: "usuarios-nadistural",
  storageBucket: "usuarios-nadistural.firebasestorage.app",
  messagingSenderId: "987383012302",
  appId: "1:987383012302:web:e6dbfc5238e8b693e0a99f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Usuarios
export async function findUserByCredentials(nombre, password) {
  try {
    const usersCol = collection(db, "usuarios");
    const q = query(usersCol, where("nombre", "==", nombre));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    for (const d of snap.docs) {
      const data = d.data();
      if (data.password === password) {
        return {
          id: d.id,
          nombre: data.nombre,
          password: data.password,
          rol: data.rol || "usuario",
          stores: data.stores || []
        };
      }
    }
    return null;
  } catch (err) {
    console.error("findUserByCredentials error:", err);
    return null;
  }
}

export async function getAllUsers() {
  const usersCol = collection(db, "usuarios");
  const snap = await getDocs(usersCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addUserToFirestore(userObj) {
  const usersCol = collection(db, "usuarios");
  const docRef = await addDoc(usersCol, userObj);
  return { id: docRef.id, ...userObj };
}

export async function updateUserInFirestore(id, data) {
  const docRef = doc(db, "usuarios", id);
  const payload = {};
  Object.keys(data || {}).forEach((k) => {
    if (data[k] !== undefined) payload[k] = data[k];
  });
  await updateDoc(docRef, payload);
  return true;
}

export async function deleteUserFromFirestore(id) {
  const docRef = doc(db, "usuarios", id);
  await deleteDoc(docRef);
}

// Tiendas
export async function getAllStores() {
  const storesCol = collection(db, "tiendas");
  const snap = await getDocs(storesCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addStoreToFirestore(name) {
  const storesCol = collection(db, "tiendas");
  const docRef = await addDoc(storesCol, { name });
  return { id: docRef.id, name };
}

export async function deleteStoreFromFirestore(storeName) {
  const storesCol = collection(db, "tiendas");
  const q = query(storesCol, where("name", "==", storeName));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

// Pedidos
export async function addPedidoToTienda(storeName, pedido) {
  const pedidosCol = collection(db, `tiendas/${storeName}/pedidos`);
  await addDoc(pedidosCol, pedido);
}

export async function getPedidosByTienda(storeName) {
  const pedidosCol = collection(db, `tiendas/${storeName}/pedidos`);
  const snap = await getDocs(pedidosCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPedidosCounterByTienda(storeName) {
  const pedidosCol = collection(db, `tiendas/${storeName}/pedidos`);
  const snap = await getDocs(pedidosCol);
  return snap.size;
}

export async function getPedidosCounterByTiendaForNextDelivery(storeName) {
  const pedidosCol = collection(db, `tiendas/${storeName}/pedidos`);
  const snap = await getDocs(pedidosCol);

  const today = new Date();
  let targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 1);
  if (today.getDay() === 6) targetDate.setDate(today.getDate() + 2);

  const yyyy = targetDate.getFullYear();
  const mm = `${targetDate.getMonth() + 1}`.padStart(2, "0");
  const dd = `${targetDate.getDate()}`.padStart(2, "0");
  const targetFecha = `${yyyy}-${mm}-${dd}`;

  const pedidosDia = snap.docs.filter(d => {
    const data = d.data();
    return data.fecha === targetFecha;
  });

  return pedidosDia.length;
}

// Eliminar pedido
export async function deletePedidoFromTienda(storeName, pedidoId) {
  if (!storeName || !pedidoId) return;
  const pedidoRef = doc(db, `tiendas/${storeName}/pedidos/${pedidoId}`);
  await deleteDoc(pedidoRef);
}

// Editar pedido
export async function updatePedidoInTienda(storeName, pedidoId, data) {
  if (!storeName || !pedidoId) return;
  const pedidoRef = doc(db, `tiendas/${storeName}/pedidos/${pedidoId}`);
  await updateDoc(pedidoRef, data);
}

export { db };