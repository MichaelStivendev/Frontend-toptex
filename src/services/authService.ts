import type { Area, RolNombre } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export type LoginRespuesta = {
  nombreCompleto: string;
  area: Area;
  rol?: RolNombre;
};

export async function loginMecanico(username: string, password: string): Promise<LoginRespuesta> {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.mensaje || "Usuario o contraseña incorrectos");
  }

  const data = await res.json();
  // El backend devuelve { usuario: { nombreCompleto, area, ... } }
  return {
    nombreCompleto: data.usuario.nombreCompleto,
    area: data.usuario.area, // "mythos" o "leonardo"
  };
}