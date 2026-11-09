// src/services/novedadesService.ts

export type NovedadTurno = "picando_peine" | "cambio_referencia" | "por_anudar" | "falta_trama";

export const ETIQUETAS_NOVEDAD: Record<NovedadTurno, { texto: string; colorCuadro: string; corto: string }> = {
  picando_peine: { texto: "Picando peine", colorCuadro: "bg-purple-600 border-purple-700 text-white", corto: "P. Peine" },
  cambio_referencia: { texto: "Cambio de referencia", colorCuadro: "bg-indigo-600 border-indigo-700 text-white", corto: "C. Ref" },
  por_anudar: { texto: "Por anudar", colorCuadro: "bg-pink-600 border-pink-700 text-white", corto: "Anudar" },
  falta_trama: { texto: "Falta de trama", colorCuadro: "bg-orange-600 border-orange-700 text-white", corto: "F. Trama" },
};

// Llave unificada y persistente
const KEY_NOVEDADES = "mvptoptex_novedades_turno_v1";

export async function obtenerNovedades(): Promise<Record<number, NovedadTurno>> {
  try {
    const data = localStorage.getItem(KEY_NOVEDADES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error leyendo novedades del localStorage:", error);
    return {};
  }
}

export async function guardarNovedades(novedades: Record<number, NovedadTurno>): Promise<void> {
  try {
    localStorage.setItem(KEY_NOVEDADES, JSON.stringify(novedades));
  } catch (error) {
    console.error("Error guardando novedades en el localStorage:", error);
  }
}