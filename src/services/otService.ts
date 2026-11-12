import type { Motivo, MotivoPausa, OT, Repuesto, Usuario } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function listarOTs(): Promise<OT[]> {
  try {
    const response = await fetch(`${API_URL}/api/ots`);
    if (!response.ok) throw new Error("Error al obtener las OTs");
    const data = await response.json();
    // Aseguramos que devuelva un arreglo válido (evitando nulls)
    return data || [];
  } catch (error) {
    console.error("Error en listarOTs:", error);
    return [];
  }
}

export async function crearOT(datos: {
  telar: number;
  motivo: Motivo;
  observacion: string;
  mecanico: string;
  usuario: Usuario;
}): Promise<OT> {
  const response = await fetch(`${API_URL}/api/ots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error("Error al crear la Orden de Trabajo en el servidor");
  }

  return await response.json();
}

export async function pausarOT(
  id: string,
  motivo: MotivoPausa,
  por: string
): Promise<OT | null> {
  try {
    const response = await fetch(`${API_URL}/api/ots/${id}/pausar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo, por }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error en pausarOT:", error);
    return null;
  }
}

export async function reanudarOT(id: string, por: string): Promise<OT | null> {
  try {
    let response = await fetch(`${API_URL}/api/ots/${id}/reanudar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ por, mecanico: por, reportado_por: por }),
    });

    if (response.status === 405) {
      response = await fetch(`${API_URL}/api/ots/${id}/reanudar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ por, mecanico: por, reportado_por: por }),
      });
    }

    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error("Error en reanudarOT:", error);
    return null;
  }
}

export async function finalizarOT(
  id: string,
  datos: {
    trabajoRealizado: string;
    personalAsignado: string;
    repuestos: Repuesto[];
    por: string;
  }
): Promise<OT | null> {
  try {
    const response = await fetch(`${API_URL}/api/ots/${id}/finalizar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error en finalizarOT:", error);
    return null;
  }
}