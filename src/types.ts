export type Categoria = "produccion" | "falla" | "apagado";

// src/types.ts

export type Area = "mythos" | "leonardo" | "todas";

export type RolNombre = "admin" | "mecanico";

export type UsuarioSesion = {
  id: string;
  username: string;
  nombreCompleto: string;
  rolId: string;
  rol: RolNombre;
  area: Area;
};

// Mantenemos Usuario para compatibilidad con las OTs existentes
export type Usuario = string;

export type Motivo =
  | "Sin urdido"
  | "Picando peine"
  | "Repasando"
  | "Iniciando telar / Cambio de artículo"
  | "Anudado / Paso de pega"
  | "Falla de trama (o trama floja / recogida)"
  | "Problemas de urdido / tensión"
  | "Falla neumática (toberas tapadas, ajuste de presión de aire)"
  | "Bloqueo electrónico (Encoder, Motor ETD/EWC)"
  | "Falla de orillo / templero"
  | "urdimbre"
  | "trama"
  | "cambio_referencia"
  | "repasando"
  | "falta_programacion"
  | "electrico"
  | "mecanico"
  | "otra_falla"
  | "apagado"
  | "fuera_servicio"
  | "Para muestra"
  | "Fallo eléctrico"
  | "Fallo de trama"
  | "Falto de urdido"
  | "Otro"
  | (string & {});

export type MotivoPausa = "cambio_turno" | "otra_maquina" | "falta_repuesto";

// Colores por categoría (verde = operativo, se maneja en Telares)
export const CATEGORIAS: Record<
  Categoria,
  {
    nombre: string;
    descripcion: string;
    cuadro: string; // cuadro del telar
    punto: string; // puntito de color
    pestana: string; // pestaña activa en el modal
    seleccion: string; // opción elegida
    boton: string; // botón de confirmar
  }
> = {
  produccion: {
    nombre: "Producción",
    descripcion: "Producción / Alistamiento",
    cuadro: "border-orange-500 bg-orange-400 text-stone-900 hover:bg-orange-500",
    punto: "bg-orange-400",
    pestana: "border-orange-500 bg-orange-50 text-orange-800",
    seleccion:
      "peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:ring-2 peer-checked:ring-orange-500/20",
    boton: "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-600/30",
  },
  falla: {
    nombre: "Falla",
    descripcion: "Fallas Mecánicas / Operativas",
    cuadro: "border-red-700 bg-red-600 text-white hover:bg-red-700",
    punto: "bg-red-600",
    pestana: "border-red-600 bg-red-50 text-red-800",
    seleccion:
      "peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:ring-2 peer-checked:ring-red-600/20",
    boton: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600/30",
  },
  apagado: {
    nombre: "Apagado",
    descripcion: "No operativo",
    cuadro: "border-stone-400 bg-stone-300 text-stone-700 hover:bg-stone-400",
    punto: "bg-stone-400",
    pestana: "border-stone-500 bg-stone-100 text-stone-800",
    seleccion:
      "peer-checked:border-stone-500 peer-checked:bg-stone-100 peer-checked:ring-2 peer-checked:ring-stone-500/20",
    boton: "bg-stone-700 hover:bg-stone-800 focus-visible:ring-stone-700/30",
  },
};

export const MOTIVOS: Record<
  string,
  { nombre: string; corto: string; categoria: Categoria }
> = {
  // Producción / Alistamiento
  "Sin urdido": {
    nombre: "Sin urdido",
    corto: "S. Urd.",
    categoria: "produccion",
  },
  "Picando peine": {
    nombre: "Picando peine",
    corto: "P. Peine",
    categoria: "produccion",
  },
  Repasando: {
    nombre: "Repasando",
    corto: "Rep.",
    categoria: "produccion",
  },
  "Iniciando telar / Cambio de artículo": {
    nombre: "Iniciando telar / Cambio de artículo",
    corto: "Inic/Art",
    categoria: "produccion",
  },
  "Anudado / Paso de pega": {
    nombre: "Anudado / Paso de pega",
    corto: "Anudado",
    categoria: "produccion",
  },

  // Fallas Mecánicas / Operativas
  "Falla de trama (o trama floja / recogida)": {
    nombre: "Falla de trama (o trama floja / recogida)",
    corto: "Trama",
    categoria: "falla",
  },
  "Problemas de urdido / tensión": {
    nombre: "Problemas de urdido / tensión",
    corto: "Urdido",
    categoria: "falla",
  },
  "Falla neumática (toberas tapadas, ajuste de presión de aire)": {
    nombre: "Falla neumática (toberas tapadas, ajuste de presión de aire)",
    corto: "Neumát.",
    categoria: "falla",
  },
  "Bloqueo electrónico (Encoder, Motor ETD/EWC)": {
    nombre: "Bloqueo electrónico (Encoder, Motor ETD/EWC)",
    corto: "Electr.",
    categoria: "falla",
  },
  "Falla de orillo / templero": {
    nombre: "Falla de orillo / templero",
    corto: "Orillo",
    categoria: "falla",
  },

  // Motivos previos / compatibilidad histórica
  urdimbre: { nombre: "Urdimbre", corto: "Urd.", categoria: "produccion" },
  trama: { nombre: "Trama", corto: "Tra.", categoria: "produccion" },
  cambio_referencia: {
    nombre: "Cambio de referencia",
    corto: "Ref.",
    categoria: "produccion",
  },
  repasando: { nombre: "Repasando", corto: "Rep.", categoria: "produccion" },
  falta_programacion: {
    nombre: "Falta de programación",
    corto: "Prog.",
    categoria: "produccion",
  },
  electrico: { nombre: "Daño eléctrico", corto: "Elec.", categoria: "falla" },
  mecanico: { nombre: "Daño mecánico", corto: "Mec.", categoria: "falla" },
  otra_falla: { nombre: "Otro", corto: "Otro", categoria: "falla" },
  apagado: { nombre: "Apagado", corto: "Off", categoria: "apagado" },
  fuera_servicio: {
    nombre: "Fuera de servicio",
    corto: "Fuera",
    categoria: "apagado",
  },
  // Motivos provenientes de "Entregar Turno"
  "Para muestra": { nombre: "Para muestra", corto: "Muestra", categoria: "produccion" },
  "Fallo eléctrico": { nombre: "Fallo eléctrico", corto: "Eléct.", categoria: "falla" },
  "Fallo de trama": { nombre: "Fallo de trama", corto: "Trama", categoria: "produccion" },
  "Falto de urdido": { nombre: "Falto de urdido", corto: "Urdido", categoria: "produccion" },
  Otro: { nombre: "Otro", corto: "Otro", categoria: "falla" },
};

const MOTIVOS_MODAL_BASE: Motivo[] = [
  // Producción / Alistamiento (produccion)
  "Sin urdido",
  "Picando peine",
  "Repasando",
  "Iniciando telar / Cambio de artículo",
  "Anudado / Paso de pega",
  "Para muestra",
  "falta_programacion",
  // Fallas Mecánicas / Operativas (falla)
  "Falla de trama (o trama floja / recogida)",
  "Problemas de urdido / tensión",
  "Falla neumática (toberas tapadas, ajuste de presión de aire)",
  "Bloqueo electrónico (Encoder, Motor ETD/EWC)",
  "Falla de orillo / templero",
  "Otro",
  // Apagado
  "apagado",
  "fuera_servicio",
];

/**
 * Devuelve siempre un objeto válido para cualquier motivo (incluso si viene un texto nuevo desde el backend),
 * evitando errores de lectura sobre undefined en Telares, Historial y OTDetalle.
 */
export function obtenerInfoMotivo(motivo?: string | null): {
  nombre: string;
  corto: string;
  categoria: Categoria;
} {
  if (!motivo) {
    return { nombre: "Sin motivo", corto: "OT", categoria: "falla" };
  }
  if (MOTIVOS[motivo]) {
    return MOTIVOS[motivo];
  }
  const limpio = String(motivo);
  return {
    nombre: limpio,
    corto: limpio.slice(0, 6),
    categoria: "falla",
  };
}

export function motivosDe(categoria: Categoria): Motivo[] {
  return MOTIVOS_MODAL_BASE.filter(
    (m) => obtenerInfoMotivo(m).categoria === categoria
  );
}

export const MOTIVOS_PAUSA: Record<MotivoPausa, string> = {
  cambio_turno: "Cambio de turno",
  otra_maquina: "Atender otra máquina",
  falta_repuesto: "Falta de repuesto",
};

export function obtenerTextoMotivoPausa(motivo?: string | null): string {
  if (!motivo) return "En pausa";
  return (MOTIVOS_PAUSA as Record<string, string>)[motivo] ?? String(motivo);
}

export type Pausa = {
  motivo: MotivoPausa;
  pausadaPor: string;
  desde: string; // fecha ISO
  reanudadaPor?: string;
  hasta?: string; // fecha ISO
};

export type Repuesto = { nombre: string; cantidad: number };

export type OT = {
  id: string; // OT-0001
  telar: number;
  motivo: Motivo;
  observacion: string;
  mecanico: string; // quien la abrió
  usuario: Usuario;
  creada: string; // fecha ISO
  estado: "abierta" | "pausada" | "finalizada";
  pausas: Pausa[];
  finalizada?: string;
  finalizadaPor?: string;
  trabajoRealizado?: string;
  trabajo_realizado?: string;
  repuestos?: Repuesto[];
  personalAsignado?: string;
};

// ---- Tiempos ----

export function calcularTiempos(ot: OT, ahora = Date.now()) {
  const inicio = new Date(ot.creada).getTime();
  const fin = ot.finalizada ? new Date(ot.finalizada).getTime() : ahora;
  const total = Math.max(0, fin - inicio);
  const pausado = (ot.pausas ?? []).reduce((acc, p) => {
    if (!p) return acc;
    const desde = new Date(p.desde).getTime();
    const hasta = p?.hasta ? new Date(p.hasta).getTime() : fin;
    return acc + Math.max(0, hasta - desde);
  }, 0);
  return { total, pausado, trabajado: Math.max(0, total - pausado) };
}

export function formatoDuracion(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return "menos de 1 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export function formatoFecha(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
