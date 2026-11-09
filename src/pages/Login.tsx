import { useState } from "react";
import { loginMecanico } from "../services/authService";
import type { Usuario } from "../types";

type Props = {
  onEntrar: (nombre: string, usuario: Usuario) => void;
};

export default function Login({ onEntrar }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const puedeEntrar = username.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeEntrar || cargando) return;

    setError(null);
    setCargando(true);

    try {
      // 1. Validamos credenciales contra Go
      const resultado = await loginMecanico(username.trim().toLowerCase(), password);

      // 2. Le pasamos el nombre real y el área ("mythos" o "leonardo")
      onEntrar(resultado.nombreCompleto, resultado.area as Usuario);
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            mvptoptex
          </h1>
          <p className="mt-2 text-stone-500">
            Ingresa tu usuario y contraseña de mecánico.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-xl shadow-stone-900/5 ring-1 ring-stone-900/5 sm:p-8"
        >
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-600/10">
              {error}
            </div>
          )}

          {/* Usuario */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: carlos o juan"
              autoComplete="username"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10"
            />
          </div>

          {/* Contraseña */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10"
            />
          </div>

          <button
            type="submit"
            disabled={!puedeEntrar || cargando}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/30 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {cargando ? "Verificando..." : "Entrar al Turno"}
          </button>
        </form>
      </div>
    </main>
  );
}