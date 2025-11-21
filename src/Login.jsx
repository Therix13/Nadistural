import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Llena ambos campos.");
      return;
    }
    const res = await onLogin(username, password, rememberMe);
    if (res.ok && rememberMe) {
      localStorage.setItem("sesion_usuario", username);
    }
    if (!res.ok) setError(res.message || "Error de login.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-2xl p-10 min-w-[340px] flex flex-col items-center"
        style={{ width: "350px" }}
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Iniciar sesión</h2>
        <label className="w-full text-left font-medium mb-1">Usuario</label>
        <input
          type="text"
          value={username}
          className="w-full h-10 px-4 mb-4 rounded-lg border border-slate-300 shadow-sm"
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="w-full text-left font-medium mb-1">Contraseña</label>
        <div className="w-full relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            className="w-full h-10 px-4 pr-12 rounded-lg border border-slate-300 shadow-sm"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-2 h-6 w-7 p-0 text-slate-500 hover:text-blue-600"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={{ background: "none", border: "none" }}
          >
            {showPassword ? (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.05 10.05 0 0 1 12 19c-5 0-9-4.03-9-9 0-1.79.52-3.47 1.43-4.89M21 21l-7-7M4.06 4.06A10.05 10.05 0 0 1 12 5c5 0 9 4.03 9 9 0 1.79-.52 3.47-1.43 4.89M1 1l22 22" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <div className="w-full flex items-center mb-5">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 mr-2 accent-blue-600"
          />
          <label htmlFor="rememberMe" className="font-medium text-slate-700 select-none text-sm cursor-pointer">
            Mantener la sesión abierta
          </label>
        </div>
        {error && (
          <div className="w-full text-sm text-red-600 font-semibold mb-2 text-center">{error}</div>
        )}
        <button
          type="submit"
          className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}