import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!user || !password) {
      setError("Escribe usuario y contraseña");
      setLoading(false);
      return;
    }
    const res = await onLogin(user, password);
    if (!res || res.ok === false) {
      setError(res?.message ?? "Credenciales inválidas");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-8 border border-slate-200 flex flex-col items-center justify-center mt-16">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Iniciar sesión</h2>
      <form className="w-full flex flex-col gap-5" onSubmit={submit} autoComplete="off">
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 font-semibold text-sm mb-1">Usuario</label>
          <input
            className="border border-slate-300 rounded-lg px-3 py-2 text-lg focus:outline-blue-400"
            value={user}
            onChange={e => setUser(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 font-semibold text-sm mb-1">Contraseña</label>
          <input
            type="password"
            className="border border-slate-300 rounded-lg px-3 py-2 text-lg focus:outline-blue-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="w-full text-center text-rose-600 font-bold text-sm">{error}</div>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow transition hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}