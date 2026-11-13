// src/pages/Telares.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
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

const cuadroOTAbierta =
  "border-red-700 bg-red-600 text-white hover:bg-red-700";

const cuadroOTPausada =
  "border-orange-500 bg-orange-400 text-stone-900 hover:bg-orange-500";

const cuadroNovedadSinOT =
  "border-red-950 bg-red-800 text-white hover:bg-red-900";

type NovedadMaquina = {
  telar?: number | string;
  numero_telar?: number | string;
  id_telar?: number | string;
  maquina?: number | string;
  id?: number | string;
  novedad?: string;
  novedad_telar?: string;
  motivo?: string;
  descripcion?: string;
  texto?: string;
};

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

  // Obtenemos el nombre completo real del mecánico desde la sesión actual (evitando enviar el área o username corto)
  const nombreRealMecanico = useMemo(() => {
    try {
      const usuarioActual = JSON.parse(
        localStorage.getItem("toptex_sesion") || "{}"
      );
      return (
        usuarioActual?.nombre_completo ||
        usuarioActual?.nombreCompleto ||
        usuarioActual?.nombre ||
        nombre
      );
    } catch {
      return nombre;
    }
  }, [nombre]);

  const [ots, setOts] = useState<OT[]>([]);
  const [otsActivadas, setOtsActivadas] = useState<OT[]>([]);
  const [novedades, setNovedades] = useState<NovedadMaquina[]>([]);
  const [vista, setVista] = useState<"telares" | "historial">("telares");
  const [filtroAreaAdmin, setFiltroAreaAdmin] = useState<FiltroAreaAdmin>("todas");
  const [plano10ColMovil, setPlano10ColMovil] = useState(false);
  const [telarAbierto, setTelarAbierto] = useState<number | null>(null);
  const [creandoOTDesdeNovedad, setCreandoOTDesdeNovedad] = useState(false);
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

  const sincronizarOTs = useCallback((lista: OT[]) => {
    const segura = Array.isArray(lista) ? lista : [];
    setOts(segura);
    setOtsActivadas(
      segura.filter((o) => o && o.estado !== "finalizada" && typeof o.telar === "number")
    );
  }, []);

  const cargarNovedadesIniciales = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/novedades`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setNovedades(data as NovedadMaquina[]);
      }
    } catch (err) {
      console.error("Error cargando novedades iniciales:", err);
    }
  }, []);

  // Procesar cada mensaje recibido por WebSocket sin perder mensajes consecutivos
  const manejarMensajeWS = useCallback(
    (rawMsg: unknown) => {
      if (!rawMsg || typeof rawMsg !== "object") return;
      console.log("📥 Evento recibido por WebSocket:", rawMsg);

      const msg = rawMsg as Record<string, unknown>;
      const accion = String(msg.accion ?? msg.action ?? msg.tipo ?? msg.evento ?? "");

      if (accion === "estado_inicial") {
        const listaActivas = msg.data ?? msg.ots ?? msg.datos ?? [];
        if (Array.isArray(listaActivas)) {
          const activasSeguras = (listaActivas as OT[]).filter(
            (o) => o && o.estado !== "finalizada" && typeof o.telar === "number"
          );
          setOtsActivadas(activasSeguras);
        }
        listarOTs().then(sincronizarOTs);
        return;
      }

      if (accion === "actualizar_novedades") {
        const listaRecibida =
          msg.data ?? msg.novedades ?? msg.datos ?? msg.lista ?? [];
        if (Array.isArray(listaRecibida)) {
          setNovedades(listaRecibida as NovedadMaquina[]);
        }
        return;
      }

      // Otros eventos de OT (CREAR_OT, ACTUALIZAR_OT, etc.)
      listarOTs().then(sincronizarOTs);
    },
    [sincronizarOTs]
  );

  const { status: wsStatus, send: wsSend } = useWebSocket(wsUrl, manejarMensajeWS);

  // Carga inicial al montar por si el WS tarda en abrir
  useEffect(() => {
    listarOTs().then(sincronizarOTs);
    cargarNovedadesIniciales();
  }, [sincronizarOTs, cargarNovedadesIniciales]);

  const activas = useMemo(() => {
    const mapa = new Map<number, OT>();
    const listaSegura = Array.isArray(otsActivadas) ? otsActivadas : [];
    listaSegura
      .filter((o) => o && o.estado !== "finalizada" && typeof o.telar === "number")
      .forEach((o) => mapa.set(Number(o.telar), o));
    return mapa;
  }, [otsActivadas]);

  // Mapa de telares detenidos con novedad (sin OT abierta) provenientes de "actualizar_novedades"
  const novedadesPorTelar = useMemo(() => {
    const mapa = new Map<number, string>();
    const listaSegura = Array.isArray(novedades) ? novedades : [];
    listaSegura.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const idBruto =
        item.telar ??
        item.numero_telar ??
        item.id_telar ??
        item.maquina ??
        item.id;
      const numTelar = Number(idBruto);
      if (!Number.isFinite(numTelar) || numTelar <= 0) return;

      const textoBruto =
        item.novedad ??
        item.novedad_telar ??
        item.motivo ??
        item.descripcion ??
        item.texto ??
        "Parado";
      mapa.set(numTelar, String(textoBruto).trim() || "Parado");
    });
    return mapa;
  }, [novedades]);

  const otActiva = telarAbierto !== null ? activas.get(telarAbierto) : undefined;
  const novedadTelarAbierto =
    telarAbierto !== null && !otActiva
      ? novedadesPorTelar.get(telarAbierto)
      : undefined;

  function cerrarModalTelar() {
    setTelarAbierto(null);
    setCreandoOTDesdeNovedad(false);
  }

  function liberarTelarAProduccion(telar: number) {
    wsSend({
      accion: "liberar_telar",
      action: "liberar_telar",
      tipo: "liberar_telar",
      telar,
      usuario: nombreRealMecanico,
    });
    setNovedades((prev) =>
      prev.filter((item) => {
        const idItem = Number(
          item?.telar ??
            item?.numero_telar ??
            item?.id_telar ??
            item?.maquina ??
            item?.id
        );
        return idItem !== Number(telar);
      })
    );
    cerrarModalTelar();
    mostrarAviso(`🟢 Telar ${telar} liberado a producción`);
  }

  function mostrarAviso(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(null), 3500);
  }

  function reemplazar(ot: OT | null) {
    if (!ot) return;
    setOts((prev) => prev.map((o) => (o.id === ot.id ? ot : o)));
    setOtsActivadas((prev) => {
      if (ot.estado === "finalizada") {
        return prev.filter((o) => o.id !== ot.id);
      }
      const existe = prev.some((o) => o.id === ot.id);
      return existe ? prev.map((o) => (o.id === ot.id ? ot : o)) : [...prev, ot];
    });
  }

  async function generar(datos: { motivo: Motivo; observacion: string }) {
    if (telarAbierto === null) return;
    const payload = {
      telar: telarAbierto,
      motivo: datos.motivo,
      observacion: datos.observacion,
      mecanico: nombreRealMecanico,
      usuario: nombreRealMecanico,
    };
    const nueva = await crearOT(payload);
    wsSend({
      accion: "crear_ot",
      action: "crear_ot",
      tipo: "ot_creada",
      ...payload,
      id: nueva.id,
    });
    setNovedades((prev) =>
      prev.filter((item) => {
        const idItem = Number(
          item?.telar ??
            item?.numero_telar ??
            item?.id_telar ??
            item?.maquina ??
            item?.id
        );
        return idItem !== Number(nueva.telar);
      })
    );
    setOts((prev) => [...prev, nueva]);
    setOtsActivadas((prev) => [
      ...prev.filter((o) => Number(o.telar) !== Number(nueva.telar)),
      nueva,
    ]);
    cerrarModalTelar();
    mostrarAviso(`${nueva.id} generada para el telar ${nueva.telar}`);
  }

  async function pausar(ot: OT, motivo: MotivoPausa) {
    reemplazar(await pausarOT(ot.id, motivo, nombreRealMecanico));
    setTelarAbierto(null);
    mostrarAviso(`${ot.id} en pausa`);
  }

  async function reanudar(ot: OT) {
    const res = await reanudarOT(ot.id, nombreRealMecanico);
    if (!res) {
      window.alert("No se pudo reanudar la OT en el servidor.");
      return;
    }

    // Actualizamos el estado local inmediatamente a "abierta" para que la vista normal de la OT se muestre sin cerrar el modal
    const ahoraIso = new Date().toISOString();
    const mapearReanudada = (o: OT): OT => {
      if (o.id !== ot.id) return o;
      if (res && typeof res === "object" && "id" in res && "estado" in res) {
        return res;
      }
      const pausasActualizadas = Array.isArray(o.pausas)
        ? o.pausas.map((p, idx, arr) =>
            idx === arr.length - 1 && !p.hasta
              ? { ...p, hasta: ahoraIso, reanudadaPor: nombreRealMecanico }
              : p
          )
        : [];
      return {
        ...o,
        estado: "abierta",
        pausas: pausasActualizadas,
      };
    };

    setOts((prev) => prev.map(mapearReanudada));
    setOtsActivadas((prev) => prev.map(mapearReanudada));

    listarOTs().then(sincronizarOTs);
    mostrarAviso(`✅ Revisión de ${ot.id} reanudada por ${nombreRealMecanico}`);
  }

  async function finalizar(
    ot: OT,
    datos: {
      trabajo_realizado: string;
      personalAsignado: string;
      usuario?: string;
      repuestos: Repuesto[];
      estado_telar: "operativo" | "parado";
      novedad_telar: string;
    }
  ) {
    const usuarioReal = datos.usuario || nombreRealMecanico;
    const personalFinal = datos.personalAsignado || usuarioReal;
    const estadoTelar = datos.estado_telar;
    const novedadTelar =
      estadoTelar === "operativo" ? "" : datos.novedad_telar.trim();
    const trabajoRealizado = datos.trabajo_realizado.trim();

    const actualizada = await finalizarOT(ot.id, {
      ...datos,
      trabajo_realizado: trabajoRealizado,
      por: usuarioReal,
      usuario: usuarioReal,
      personalAsignado: personalFinal,
      estado_telar: estadoTelar,
      novedad_telar: novedadTelar,
    });
    wsSend({
      accion: "FINALIZAR_OT",
      tipo: "ot_finalizada",
      id: ot.id,
      telar: ot.telar,
      trabajo_realizado: trabajoRealizado,
      usuario: usuarioReal,
      por: usuarioReal,
      finalizada_por: usuarioReal,
      personalAsignado: personalFinal,
      trabajo_realizado_por: personalFinal,
      repuestos: datos.repuestos,
      estado_telar: estadoTelar,
      novedad_telar: novedadTelar,
    });
    setNovedades((prev) => {
      const sinEsteTelar = prev.filter((item) => {
        const idItem = Number(
          item.telar ?? item.numero_telar ?? item.id_telar ?? item.maquina ?? item.id
        );
        return idItem !== ot.telar;
      });
      if (estadoTelar === "parado") {
        return [
          ...sinEsteTelar,
          {
            telar: ot.telar,
            novedad: novedadTelar || "Parado",
            usuario: usuarioReal,
          },
        ];
      }
      return sinEsteTelar;
    });
    reemplazar(actualizada);
    setTelarAbierto(null);
    mostrarAviso(
      estadoTelar === "operativo"
        ? `Telar ${ot.telar} operativo de nuevo`
        : `OT de telar ${ot.telar} finalizada (queda parado)`
    );
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
    setCreandoOTDesdeNovedad(false);
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
      // Extraemos el nombre completo real del usuario desde la sesión actual
      const usuarioSesionNombre = nombreRealMecanico;

      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/turnos/entregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportado_por: usuarioSesionNombre,
          usuario: usuarioSesionNombre,
          mecanico: usuarioSesionNombre,
          novedades: listaNovedades,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo registrar la entrega de turno en el servidor.");
      }

      window.alert(`¡Entrega de turno exitosa! Se reportaron ${listaNovedades.length} telar(es).`);
      mostrarAviso(`Turno entregado (${listaNovedades.length} telares reportados)`);
      cancelarModoEntrega();
      listarOTs().then(sincronizarOTs);
    } catch (error) {
      console.error("Error al entregar turno:", error);
      window.alert("Ocurrió un error al enviar la entrega de turno. Intenta nuevamente.");
    } finally {
      setEnviandoEntrega(false);
    }
  }

  const conteo: Record<Categoria, number> = { produccion: 0, falla: 0, apagado: 0 };
  let paradosSinOT = 0;
  numeros.forEach((n) => {
    const ot = activas.get(n);
    if (ot) {
      const cat = obtenerInfoMotivo(ot.motivo).categoria;
      conteo[cat] = (conteo[cat] ?? 0) + 1;
    } else if (novedadesPorTelar.has(n)) {
      paradosSinOT += 1;
    }
  });
  const operativos = Math.max(
    0,
    numeros.length - Object.values(conteo).reduce((a, b) => a + b, 0) - paradosSinOT
  );

  const leyenda = [
    { nombre: "Operativos", punto: "bg-emerald-600", n: operativos },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
      nombre: CATEGORIAS[c].nombre,
      punto: CATEGORIAS[c].punto,
      n: conteo[c],
    })),
    ...(paradosSinOT > 0
      ? [{ nombre: "Parado (Novedad)", punto: "bg-red-800", n: paradosSinOT }]
      : []),
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

                        // Paso A: Busca si el telar tiene una OT en otsActivadas.
                        // Si sí, píntalo según la OT (Rojo normal si abierta, Naranja si pausada).
                        const ot = otsActivadas.find(
                          (o) =>
                            o &&
                            o.estado !== "finalizada" &&
                            Number(o.telar) === Number(n)
                        );
                        const infoOt = ot ? obtenerInfoMotivo(ot.motivo) : null;
                        const pausada = ot?.estado === "pausada";

                        // Paso B: Si NO tiene OT activa, busca si el ID del telar existe en el array novedades.
                        // Si existe, píntalo de Rojo Oscuro (bg-red-800) y muestra el texto de la novedad.
                        const novedadEncontrada = !ot
                          ? novedades.find((item) => {
                              const idItem =
                                item?.telar ??
                                item?.numero_telar ??
                                item?.id_telar ??
                                item?.maquina ??
                                item?.id;
                              return Number(idItem) === Number(n);
                            })
                          : undefined;

                        const textoNovedad = novedadEncontrada
                          ? String(
                              novedadEncontrada.novedad ??
                                novedadEncontrada.novedad_telar ??
                                novedadEncontrada.motivo ??
                                novedadEncontrada.descripcion ??
                                novedadEncontrada.texto ??
                                "Parado"
                            ).trim() || "Parado"
                          : undefined;
                        const tieneNovedadSinOT = !ot && Boolean(novedadEncontrada);

                        const motivoEntregaAsignado =
                          typeof novedadesTurno[n] === "string" ? novedadesTurno[n] : undefined;
                        const seleccionadoEnEntrega = motivoEntregaAsignado !== undefined;
                        const infoEntrega = seleccionadoEnEntrega
                          ? infoMotivoEntrega(motivoEntregaAsignado)
                          : null;

                        // Paso C: Si no está en OTs ni en Novedades, píntalo de Verde (Operativo).
                        let clases = cuadroOperativo;
                        if (seleccionadoEnEntrega && infoEntrega) {
                          clases = infoEntrega.color;
                        } else if (ot) {
                          clases = pausada ? cuadroOTPausada : cuadroOTAbierta;
                        } else if (tieneNovedadSinOT) {
                          clases = cuadroNovedadSinOT;
                        }

                        return (
                          <button
                            key={n}
                            onClick={() => manejarClickTelar(n)}
                            aria-label={`Telar ${n}`}
                            title={
                              tieneNovedadSinOT
                                ? `Telar ${n} parado: ${textoNovedad}`
                                : undefined
                            }
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
                            ) : ot && infoOt ? (
                              <span
                                className={`mt-0.5 font-medium leading-none opacity-90 truncate max-w-full px-0.5 ${
                                  plano10ColMovil
                                    ? "text-[7px] sm:text-[10px]"
                                    : "text-[9px] sm:text-[10px]"
                                }`}
                              >
                                {pausada ? "Pausa" : infoOt.corto}
                              </span>
                            ) : tieneNovedadSinOT ? (
                              <span
                                className={`mt-0.5 font-medium leading-tight opacity-95 truncate max-w-full px-0.5 ${
                                  plano10ColMovil
                                    ? "text-[7px] sm:text-[9px]"
                                    : "text-[8px] sm:text-[10px]"
                                }`}
                              >
                                {textoNovedad}
                              </span>
                            ) : null}
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

      {telarAbierto !== null &&
        !otActiva &&
        novedadTelarAbierto !== undefined &&
        !creandoOTDesdeNovedad && (
          <div
            className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
            onClick={cerrarModalTelar}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="novedad-telar-titulo"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-800 px-3 py-1 text-xs font-bold text-white">
                    🔴 Telar Parado (Novedad)
                  </span>
                  <h2
                    id="novedad-telar-titulo"
                    className="mt-2 text-xl font-bold text-stone-900"
                  >
                    Telar {telarAbierto}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={cerrarModalTelar}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/70 p-4">
                <p className="text-xs font-bold tracking-wider text-red-800 uppercase">
                  Motivo de novedad / paro
                </p>
                <p className="mt-1 text-base font-semibold text-stone-900">
                  {novedadTelarAbierto}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setCreandoOTDesdeNovedad(true)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-red-700 active:scale-[0.99]"
                >
                  🔧 Abrir Nueva OT
                </button>
                <button
                  type="button"
                  onClick={() => liberarTelarAProduccion(telarAbierto)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  🟢 Liberar a Producción
                </button>
              </div>
            </div>
          </div>
        )}

      {telarAbierto !== null &&
        !otActiva &&
        (novedadTelarAbierto === undefined || creandoOTDesdeNovedad) && (
          <OTModal
            telar={telarAbierto}
            mecanico={nombre}
            onCerrar={cerrarModalTelar}
            onGenerar={generar}
          />
        )}

      {telarAbierto !== null && otActiva && (
        <OTDetalle
          ot={otActiva}
          mecanico={nombre}
          onCerrar={cerrarModalTelar}
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
