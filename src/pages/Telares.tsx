// src/pages/Telares.tsx
import { useEffect, useMemo, useState } from "react";
import OTModal from "../components/OTModal";
import OTDetalle from "../components/OTDetalle";
import Historial from "../components/historial";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  crearOT,
  finalizarOT,
  listarOTs,
  pausarOT,
  reanudarOT,
} from "../services/otService";
import { CATEGORIAS, obtenerInfoMotivo } from "../types";
import type { Categoria, Motivo, MotivoPausa, OT, Repuesto, Usuario } from "../types";

type Props = {
  nombre: string;
  usuario: Usuario;
  onSalir: () => void;
};

export const mythosLayout: (number | null)[][] = [
  [191, 192, 193, 194, 195, 196, 197, 198, 199, 200],
  [181, 182, 183, 184, 185, 186, 187, 188, 189, 190],
  [171, 172, 173, 174, 175, 176, 177, 178, 179, 180],
  [161, 162, 163, 164, 165, 166, 167, 168, 169, 170],
  [151, 152, 153, 154, 155, 156, 157, 158, 159, 160],
  [141, 142, 143, 144, 145, 146, 147, 148, 149, 150],
  [131, 132, 133, 134, 135, 136, 137, 138, 139, 140],
  [121, 122, 123, 124, 125, 126, 127, 128, 129, 130],
];

export const leonardoLayout: (number | null)[][] = [
  [71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
  [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
  [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  [11, 12, 13, 14, null, 102, 16, 17, 18, null],
  [1, 2, 3, 4, null, 101, 6, 7, 8, null],
];

const extraerTelares = (layout: (number | null)[][]): number[] =>
  layout.flat().filter((n): n is number => n !== null);

const TELARES_MYTHOS = extraerTelares(mythosLayout);
const TELARES_LEONARDO = extraerTelares(leonardoLayout);

const colorUsuario: Record<Usuario, string> = {
  mythos: "bg-teal-600",
  leonardo: "bg-amber-500",
  todas: "bg-stone-900",
  admin: "bg-stone-900",
};

const cuadroOperativo =
  "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700";

const MOTIVOS_ENTREGA = [
  // Producción
  {
    valor: "Sin urdido",
    corto: "S. Urd.",
    grupo: "Producción",
    color: "bg-teal-600 border-teal-900 text-white",
  },
  {
    valor: "Picando peine",
    corto: "P. Peine",
    grupo: "Producción",
    color: "bg-orange-500 border-orange-800 text-white",
  },
  {
    valor: "Repasando",
    corto: "Rep.",
    grupo: "Producción",
    color: "bg-amber-500 border-amber-800 text-stone-950",
  },
  {
    valor: "Iniciando telar / Cambio de artículo",
    corto: "Inic/Art",
    grupo: "Producción",
    color: "bg-yellow-500 border-yellow-800 text-stone-950",
  },
  {
    valor: "Anudado / Paso de pega",
    corto: "Anudado",
    grupo: "Producción",
    color: "bg-purple-600 border-purple-900 text-white",
  },
  {
    valor: "Para muestra",
    corto: "Muestra",
    grupo: "Producción",
    color: "bg-fuchsia-600 border-fuchsia-900 text-white",
  },
  // Fallas Mecánicas / Operativas
  {
    valor: "Falla de trama (o trama floja / recogida)",
    corto: "Trama",
    grupo: "Fallas",
    color: "bg-rose-600 border-rose-900 text-white",
  },
  {
    valor: "Problemas de urdido / tensión",
    corto: "Urdido",
    grupo: "Fallas",
    color: "bg-red-600 border-red-900 text-white",
  },
  {
    valor: "Falla neumática (toberas tapadas, ajuste de presión de aire)",
    corto: "Neumát.",
    grupo: "Fallas",
    color: "bg-sky-600 border-sky-900 text-white",
  },
  {
    valor: "Bloqueo electrónico (Encoder, Motor ETD/EWC)",
    corto: "Electr.",
    grupo: "Fallas",
    color: "bg-indigo-600 border-indigo-900 text-white",
  },
  {
    valor: "Falla de orillo / templero",
    corto: "Orillo",
    grupo: "Fallas",
    color: "bg-pink-600 border-pink-900 text-white",
  },
  {
    valor: "Otro",
    corto: "Otro",
    grupo: "Fallas",
    color: "bg-stone-700 border-stone-950 text-white",
  },
] as const;

function infoMotivoEntrega(motivo: string) {
  return (
    MOTIVOS_ENTREGA.find((m) => m.valor === motivo) ?? {
      valor: motivo,
      corto: motivo.slice(0, 6),
      color: "bg-purple-600 border-purple-900 text-white",
    }
  );
}

type FiltroAreaAdmin = "todas" | "mythos" | "leonardo";

export default function Telares({ nombre, usuario, onSalir }: Props) {
  const esAdmin = usuario === "todas" || usuario === "admin";

  const [ots, setOts] = useState<OT[]>([]);
  const [vista, setVista] = useState<"telares" | "historial">("telares");
  const [filtroAreaAdmin, setFiltroAreaAdmin] = useState<FiltroAreaAdmin>("todas");
  const [plano10ColMovil, setPlano10ColMovil] = useState(false);
  const [telarAbierto, setTelarAbierto] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Estados para "Entregar Turno"
  const [modoEntrega, setModoEntrega] = useState<boolean>(false);
  const [motivoActivo, setMotivoActivo] = useState<string>("Para muestra");
  const [motivoOtroEntrega, setMotivoOtroEntrega] = useState<string>("");
  const [novedadesTurno, setNovedadesTurno] = useState<Record<number, string>>({});
  const [enviandoEntrega, setEnviandoEntrega] = useState<boolean>(false);

  const areaActiva: FiltroAreaAdmin = esAdmin
    ? filtroAreaAdmin
    : usuario === "leonardo"
      ? "leonardo"
      : "mythos";

  const seccionesVisibles = useMemo(() => {
    if (areaActiva === "mythos") {
      return [
        {
          id: "mythos" as const,
          titulo: "Área Mythos",
          subtitulo: "Telares 121 – 200",
          badge: "bg-teal-600",
          layout: mythosLayout,
          telares: TELARES_MYTHOS,
        },
      ];
    }
    if (areaActiva === "leonardo") {
      return [
        {
          id: "leonardo" as const,
          titulo: "Área Leonardo",
          subtitulo: "Telares 1 – 80 · 101 – 102",
          badge: "bg-amber-500",
          layout: leonardoLayout,
          telares: TELARES_LEONARDO,
        },
      ];
    }
    return [
      {
        id: "mythos" as const,
        titulo: "Área Mythos",
        subtitulo: "Telares 121 – 200",
        badge: "bg-teal-600",
        layout: mythosLayout,
        telares: TELARES_MYTHOS,
      },
      {
        id: "leonardo" as const,
        titulo: "Área Leonardo",
        subtitulo: "Telares 1 – 80 · 101 – 102",
        badge: "bg-amber-500",
        layout: leonardoLayout,
        telares: TELARES_LEONARDO,
      },
    ];
  }, [areaActiva]);

  const numeros = useMemo(
    () => seccionesVisibles.flatMap((s) => s.telares),
    [seccionesVisibles]
  );

  const desde = useMemo(() => (numeros.length > 0 ? Math.min(...numeros) : 1), [numeros]);
  const hasta = useMemo(() => (numeros.length > 0 ? Math.max(...numeros) : 200), [numeros]);

  // URL de WebSocket con parámetros de sesión y reconexión Exponential Backoff
  const wsUrl = useMemo(() => {
    const base = import.meta.env.VITE_WS_URL;
    const params = new URLSearchParams({ usuario, nombre });
    return `${base}/ws?${params.toString()}`;
  }, [usuario, nombre]);

  const { status: wsStatus, data: wsData, send: wsSend } = useWebSocket(wsUrl);

  // Carga inicial y resincronización automática al conectar o reconectar
  useEffect(() => {
    if (wsStatus === "connected") {
      listarOTs().then(setOts);
    }
  }, [wsStatus]);

  // Refrescar lista de OTs cada vez que llega un evento por WebSocket
  useEffect(() => {
    if (wsData !== null) {
      console.log("📥 Evento recibido por WebSocket:", wsData);
      listarOTs().then(setOts);
    }
  }, [wsData]);

  // Carga inicial al montar por si el WS tarda en abrir
  useEffect(() => {
    listarOTs().then(setOts);
  }, []);

  const activas = useMemo(() => {
    const mapa = new Map<number, OT>();
    const listaSegura = Array.isArray(ots) ? ots : [];
    listaSegura
      .filter((o) => o && o.estado !== "finalizada" && typeof o.telar === "number")
      .forEach((o) => mapa.set(o.telar, o));
    return mapa;
  }, [ots]);

  const otActiva = telarAbierto !== null ? activas.get(telarAbierto) : undefined;

  function mostrarAviso(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(null), 3500);
  }

  function reemplazar(ot: OT | null) {
    if (ot) setOts((prev) => prev.map((o) => (o.id === ot.id ? ot : o)));
  }

  async function generar(datos: { motivo: Motivo; observacion: string }) {
    if (telarAbierto === null) return;
    const payload = {
      telar: telarAbierto,
      motivo: datos.motivo,
      observacion: datos.observacion,
      mecanico: nombre,
      usuario,
    };
    const nueva = await crearOT(payload);
    wsSend({ tipo: "ot_creada", ...payload, id: nueva.id });
    setOts((prev) => [...prev, nueva]);
    setTelarAbierto(null);
    mostrarAviso(`${nueva.id} generada para el telar ${nueva.telar}`);
  }

  async function pausar(ot: OT, motivo: MotivoPausa) {
    reemplazar(await pausarOT(ot.id, motivo, nombre));
    setTelarAbierto(null);
    mostrarAviso(`${ot.id} en pausa`);
  }

  async function reanudar(ot: OT) {
    const res = await reanudarOT(ot.id, nombre);
    if (!res) {
      window.alert("No se pudo reanudar la OT en el servidor.");
      return;
    }

    // Actualizamos el estado local inmediatamente a "abierta" para que la vista normal de la OT se muestre sin cerrar el modal
    const ahoraIso = new Date().toISOString();
    setOts((prev) =>
      prev.map((o) => {
        if (o.id !== ot.id) return o;
        if (res && typeof res === "object" && "id" in res && "estado" in res) {
          return res;
        }
        const pausasActualizadas = Array.isArray(o.pausas)
          ? o.pausas.map((p, idx, arr) =>
              idx === arr.length - 1 && !p.hasta
                ? { ...p, hasta: ahoraIso, reanudadaPor: nombre }
                : p
            )
          : [];
        return {
          ...o,
          estado: "abierta",
          pausas: pausasActualizadas,
        };
      })
    );

    listarOTs().then(setOts);
    mostrarAviso(`✅ Revisión de ${ot.id} reanudada por ${nombre}`);
  }

  async function finalizar(
    ot: OT,
    datos: {
      trabajoRealizado: string;
      personalAsignado: string;
      repuestos: Repuesto[];
    }
  ) {
    const personalFinal = datos.personalAsignado || nombre;
    const actualizada = await finalizarOT(ot.id, {
      ...datos,
      por: nombre,
      personalAsignado: personalFinal,
    });
    wsSend({
      tipo: "ot_finalizada",
      id: ot.id,
      telar: ot.telar,
      trabajoRealizado: datos.trabajoRealizado,
      personalAsignado: personalFinal,
      trabajo_realizado_por: personalFinal,
      repuestos: datos.repuestos,
    });
    reemplazar(actualizada);
    setTelarAbierto(null);
    mostrarAviso(`Telar ${ot.telar} operativo de nuevo`);
  }

  // Interacción en el mapa: Pintar si está en modoEntrega, o abrir OT normal
  function manejarClickTelar(n: number) {
    if (modoEntrega) {
      const motivoAsignar =
        motivoActivo === "Otro"
          ? motivoOtroEntrega.trim() || "Otro"
          : motivoActivo;
      setNovedadesTurno((prev) => {
        const copia = { ...prev };
        if (copia[n] !== undefined) {
          delete copia[n];
        } else {
          copia[n] = motivoAsignar;
        }
        return copia;
      });
      return;
    }
    setTelarAbierto(n);
  }

  function cancelarModoEntrega() {
    setModoEntrega(false);
    setNovedadesTurno({});
    setMotivoActivo("Para muestra");
    setMotivoOtroEntrega("");
  }

  async function confirmarEntregaTurno() {
    const textoOtro = motivoOtroEntrega.trim();
    const listaNovedades = Object.entries(novedadesTurno).map(([telar, motivo]) => ({
      telar: Number(telar),
      motivo: motivo === "Otro" && textoOtro ? textoOtro : motivo,
    }));

    if (listaNovedades.length === 0) {
      window.alert("Selecciona al menos un telar en el mapa antes de confirmar la entrega de turno.");
      return;
    }

    setEnviandoEntrega(true);
    try {
      // Extraemos el nombre del usuario directamente de la sesión actual (sin inputs adicionales)
      let usuarioSesionNombre = nombre;
      if (!usuarioSesionNombre) {
        try {
          const sesionGuardada = JSON.parse(localStorage.getItem("toptex_sesion") || "{}");
          usuarioSesionNombre = sesionGuardada?.nombre || usuario;
        } catch {
          usuarioSesionNombre = usuario;
        }
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/turnos/entregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportado_por: usuarioSesionNombre,
          novedades: listaNovedades,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo registrar la entrega de turno en el servidor.");
      }

      window.alert(`¡Entrega de turno exitosa! Se reportaron ${listaNovedades.length} telar(es).`);
      mostrarAviso(`Turno entregado (${listaNovedades.length} telares reportados)`);
      cancelarModoEntrega();
      listarOTs().then(setOts);
    } catch (error) {
      console.error("Error al entregar turno:", error);
      window.alert("Ocurrió un error al enviar la entrega de turno. Intenta nuevamente.");
    } finally {
      setEnviandoEntrega(false);
    }
  }

  const conteo: Record<Categoria, number> = { produccion: 0, falla: 0, apagado: 0 };
  numeros.forEach((n) => {
    const ot = activas.get(n);
    if (ot) {
      const cat = obtenerInfoMotivo(ot.motivo).categoria;
      conteo[cat] = (conteo[cat] ?? 0) + 1;
    }
  });
  const operativos = Math.max(
    0,
    numeros.length - Object.values(conteo).reduce((a, b) => a + b, 0)
  );

  const leyenda = [
    { nombre: "Operativos", punto: "bg-emerald-600", n: operativos },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
      nombre: CATEGORIAS[c].nombre,
      punto: CATEGORIAS[c].punto,
      n: conteo[c],
    })),
  ];

  // Mobile-first: 5 columnas táctiles por defecto en móvil (o 10 columnas si activa vista plano)
  // y 10 columnas exactas del plano en pantallas >= sm (640px)
  const clasesGrid = plano10ColMovil
    ? "grid grid-cols-10 gap-1 sm:gap-2"
    : "grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2";

  const totalSeleccionadosEntrega = Object.keys(novedadesTurno).length;

  return (
    <div className={`min-h-screen bg-stone-100 ${modoEntrega ? "pb-64" : "pb-20"}`}>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${colorUsuario[usuario] ?? "bg-stone-900"}`}
            >
              {usuario === "mythos" ? "M" : usuario === "leonardo" ? "L" : "A"}
            </span>
            <div className="leading-tight">
              <p className="text-xs text-stone-500 sm:text-sm">
                {esAdmin ? "Administrador" : "Mecánico"}
              </p>
              <p className="font-semibold text-stone-900">{nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              title={`Estado WebSocket: ${wsStatus}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                wsStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  : wsStatus === "reconnecting" || wsStatus === "connecting"
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wsStatus === "connected"
                    ? "bg-emerald-500"
                    : wsStatus === "reconnecting" || wsStatus === "connecting"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-red-500"
                }`}
              />
              <span className="hidden sm:inline">
                {wsStatus === "connected"
                  ? "En línea"
                  : wsStatus === "reconnecting"
                    ? "Reconectando..."
                    : wsStatus === "connecting"
                      ? "Conectando..."
                      : "Desconectado"}
              </span>
            </span>
            <button
              onClick={onSalir}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        {/* Barra superior de navegación: Vista (Telares / Historial) + Filtro de Área para Admin */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex self-start rounded-xl bg-stone-200 p-1">
            {(["telares", "historial"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                aria-pressed={vista === v}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition sm:px-5 ${
                  vista === v
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {esAdmin && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-stone-200/80 p-1 self-start sm:self-auto">
              {(
                [
                  { id: "todas", label: "Planta Completa" },
                  { id: "mythos", label: "Mythos (121–200)" },
                  { id: "leonardo", label: "Leonardo (1–80)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFiltroAreaAdmin(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    filtroAreaAdmin === tab.id
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {vista === "telares" ? (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                  {esAdmin
                    ? filtroAreaAdmin === "todas"
                      ? "Plano General de Telares (Admin)"
                      : filtroAreaAdmin === "mythos"
                        ? "Área Mythos (Admin)"
                        : "Área Leonardo (Admin)"
                    : areaActiva === "mythos"
                      ? "Área Mythos"
                      : "Área Leonardo"}
                </h1>
                <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
                  {modoEntrega
                    ? `Modo Entrega activo: Toca los telares para asignarles "${motivoActivo}". Toca de nuevo para desmarcar.`
                    : "Toca un telar para gestionar su OT o inicia la entrega de turno."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botón principal "Entregar Turno" */}
                {!modoEntrega ? (
                  <button
                    type="button"
                    onClick={() => setModoEntrega(true)}
                    className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-stone-700 active:scale-95"
                  >
                    ⚡ Entregar Turno
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelarModoEntrega}
                    className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 active:scale-95"
                  >
                    Cancelar Entrega ({totalSeleccionadosEntrega})
                  </button>
                )}

                {/* Botón Mobile-First para alternar entre 5 col (cómodo al tacto) y 10 col (plano exacto) en celular */}
                <button
                  type="button"
                  onClick={() => setPlano10ColMovil((prev) => !prev)}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-xs transition active:scale-95 sm:hidden"
                >
                  {plano10ColMovil ? "📱 5 col (Táctil)" : "🗺️ 10 col (Plano)"}
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-1.5 sm:gap-2">
              {leyenda.map((l) => (
                <div
                  key={l.nombre}
                  className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-stone-900/5 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${l.punto}`} />
                  <span className="text-stone-600">{l.nombre}</span>
                  <span className="font-semibold text-stone-900">{l.n}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {seccionesVisibles.map((seccion) => (
                <section
                  key={seccion.id}
                  className="rounded-2xl border border-stone-200/80 bg-white p-2.5 shadow-xs sm:rounded-3xl sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${seccion.badge}`} />
                      <h2 className="text-sm font-bold text-stone-900 sm:text-base">
                        {seccion.titulo}
                      </h2>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                      {seccion.subtitulo}
                    </span>
                  </div>

                  <div className={clasesGrid}>
                    {seccion.layout.map((fila, filaIdx) =>
                      fila.map((n, colIdx) => {
                        if (n === null) {
                          return (
                            <div
                              key={`vacio-${seccion.id}-${filaIdx}-${colIdx}`}
                              aria-hidden="true"
                              className="aspect-square rounded-lg border border-dashed border-stone-200 bg-stone-50/70 sm:rounded-xl"
                            />
                          );
                        }

                        const ot = activas.get(n);
                        const infoOt = ot ? obtenerInfoMotivo(ot.motivo) : null;
                        const motivoEntregaAsignado =
                          typeof novedadesTurno[n] === "string" ? novedadesTurno[n] : undefined;
                        const seleccionadoEnEntrega = motivoEntregaAsignado !== undefined;
                        const infoEntrega = seleccionadoEnEntrega
                          ? infoMotivoEntrega(motivoEntregaAsignado)
                          : null;

                        let clases = cuadroOperativo;
                        if (seleccionadoEnEntrega && infoEntrega) {
                          clases = infoEntrega.color;
                        } else if (infoOt) {
                          clases = CATEGORIAS[infoOt.categoria]?.cuadro ?? cuadroOperativo;
                        }

                        const pausada = ot?.estado === "pausada";

                        return (
                          <button
                            key={n}
                            onClick={() => manejarClickTelar(n)}
                            aria-label={`Telar ${n}`}
                            className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/30 sm:rounded-xl ${
                              plano10ColMovil
                                ? "text-[10px] sm:text-sm"
                                : "text-xs sm:text-sm"
                            } ${clases} ${
                              seleccionadoEnEntrega
                                ? "border-2 border-white ring-4 ring-stone-900 shadow-lg z-1"
                                : pausada
                                  ? "ring-2 ring-stone-900 ring-offset-1"
                                  : ""
                            } ${modoEntrega ? "cursor-crosshair" : ""}`}
                          >
                            <span className="leading-none">{n}</span>

                            {seleccionadoEnEntrega && infoEntrega ? (
                              <span
                                className={`mt-0.5 rounded bg-black/40 px-1 font-bold leading-none text-white truncate max-w-full ${
                                  plano10ColMovil
                                    ? "text-[7px] sm:text-[9px]"
                                    : "text-[8px] sm:text-[10px]"
                                }`}
                              >
                                {infoEntrega.corto}
                              </span>
                            ) : (
                              ot &&
                              infoOt && (
                                <span
                                  className={`mt-0.5 font-medium leading-none opacity-90 truncate max-w-full px-0.5 ${
                                    plano10ColMovil
                                      ? "text-[7px] sm:text-[10px]"
                                      : "text-[9px] sm:text-[10px]"
                                  }`}
                                >
                                  {pausada ? "Pausa" : infoOt.corto}
                                </span>
                              )
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-4 text-2xl font-bold tracking-tight text-stone-900">
              Historial de OT
            </h1>
            <Historial ots={ots} desde={desde} hasta={hasta} />
          </>
        )}
      </main>

      {/* Barra Flotante de Modo Entrega */}
      {modoEntrega && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur">
          <div className="mx-auto max-w-4xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                  {totalSeleccionadosEntrega}
                </span>
                <p className="text-xs font-semibold text-stone-800 sm:text-sm">
                  Elige el motivo y toca los telares en el mapa:
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarModoEntrega}
                className="text-xs font-semibold text-stone-500 underline hover:text-red-600"
              >
                Salir del modo entrega
              </button>
            </div>

            {/* Botones de selección de motivoActivo agrupados */}
            <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wide text-orange-700 uppercase">
                  Producción
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIVOS_ENTREGA.filter((m) => m.grupo === "Producción").map((m) => {
                    const activo = motivoActivo === m.valor;
                    return (
                      <button
                        key={m.valor}
                        type="button"
                        onClick={() => setMotivoActivo(m.valor)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 sm:text-sm ${
                          activo
                            ? "bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1 shadow-sm"
                            : "bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100"
                        }`}
                      >
                        {m.valor}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wide text-red-700 uppercase">
                  Fallas Mecánicas / Operativas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIVOS_ENTREGA.filter((m) => m.grupo === "Fallas").map((m) => {
                    const activo = motivoActivo === m.valor;
                    return (
                      <button
                        key={m.valor}
                        type="button"
                        onClick={() => setMotivoActivo(m.valor)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 sm:text-sm ${
                          activo
                            ? "bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1 shadow-sm"
                            : "bg-red-50 text-red-950 border border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {m.valor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {motivoActivo === "Otro" && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={motivoOtroEntrega}
                    onChange={(e) => setMotivoOtroEntrega(e.target.value)}
                    placeholder="Escribe el motivo para los telares seleccionados con 'Otro'..."
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900/20"
                  />
                </div>
              )}
            </div>

            {/* Botón grande de envío final */}
            <button
              type="button"
              disabled={enviandoEntrega || totalSeleccionadosEntrega === 0}
              onClick={confirmarEntregaTurno}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {enviandoEntrega
                ? "Enviando entrega de turno..."
                : `Confirmar y Pausar Turno (${totalSeleccionadosEntrega})`}
            </button>
          </div>
        </div>
      )}

      {telarAbierto !== null && !otActiva && (
        <OTModal
          telar={telarAbierto}
          mecanico={nombre}
          onCerrar={() => setTelarAbierto(null)}
          onGenerar={generar}
        />
      )}

      {telarAbierto !== null && otActiva && (
        <OTDetalle
          ot={otActiva}
          mecanico={nombre}
          onCerrar={() => setTelarAbierto(null)}
          onPausar={(m) => pausar(otActiva, m)}
          onReanudar={() => reanudar(otActiva)}
          onFinalizar={(d) => finalizar(otActiva, d)}
        />
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg"
        >
          {aviso}
        </div>
      )}
    </div>
  );
}
