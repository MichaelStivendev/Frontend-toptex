// src/pages/Telares.tsx
import { useEffect, useMemo, useState } from "react";
import { WS_URL } from "../config";
import OTModal from "../components/OTModal";
import OTDetalle from "../components/OTDetalle";
import Historial from "../components/historial";
import PanelEntregaTurno from "../components/PanelEntregaTurno";
import {
  crearOT,
  finalizarOT,
  listarOTs,
  pausarOT,
  reanudarOT,
} from "../services/otService";
import {
  obtenerNovedades,
  guardarNovedades,
  ETIQUETAS_NOVEDAD,
  type NovedadTurno,
} from "../services/novedadesService";
import { CATEGORIAS, MOTIVOS } from "../types";
import type { Categoria, Motivo, MotivoPausa, OT, Repuesto, Usuario } from "../types";

type Props = {
  nombre: string;
  usuario: Usuario;
  onSalir: () => void;
};

const TOTAL = 200;
const FIN_AREA_1 = 100;

const areaPorUsuario: Record<
  Usuario,
  { titulo: string; desde: number; hasta: number }
> = {
  mythos: { titulo: "Área 1", desde: 1, hasta: FIN_AREA_1 },
  leonardo: { titulo: "Área 2", desde: FIN_AREA_1 + 1, hasta: TOTAL },
  todas: { titulo: "Todas las Áreas", desde: 1, hasta: TOTAL },
  admin: { titulo: "Todas las Áreas", desde: 1, hasta: TOTAL },
};

const colorUsuario: Record<Usuario, string> = {
  mythos: "bg-teal-600",
  leonardo: "bg-amber-500",
  todas: "bg-stone-900",
  admin: "bg-stone-900",
};

const cuadroOperativo =
  "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700";

export default function Telares({ nombre, usuario, onSalir }: Props) {
  const [ots, setOts] = useState<OT[]>([]);
  const [vista, setVista] = useState<"telares" | "historial">("telares");
  const [telarAbierto, setTelarAbierto] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [novedadActiva, setNovedadActiva] = useState<NovedadTurno | null>(null);
  const [novedadesTelares, setNovedadesTelares] = useState<Record<number, NovedadTurno>>({});

  const area = areaPorUsuario[usuario] ?? {
    titulo: "Todas las Áreas",
    desde: 1,
    hasta: TOTAL,
  };

  // Carga inicial y configuración de WebSocket en tiempo real
  useEffect(() => {
    // 1. Carga inicial de datos desde la API REST
    listarOTs().then(setOts);
    obtenerNovedades().then(setNovedadesTelares);

    // 2. Conexión WebSocket para sincronización en tiempo real
    const wsEndpoint = WS_URL.endsWith("/ws") ? WS_URL : `${WS_URL}/ws`;
    const ws = new WebSocket(wsEndpoint);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📥 Evento recibido por WebSocket:", message);

        // Cuando el servidor avisa de un cambio, refrescamos la lista completa de OTs
        listarOTs().then(setOts);
      } catch (error) {
        console.error("Error al procesar mensaje de WebSocket:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Error en conexión WebSocket:", error);
    };

    // Limpieza al desmontar el componente
    return () => {
      ws.close();
    };
  }, []);

  const activas = useMemo(() => {
    const mapa = new Map<number, OT>();
    ots.filter((o) => o.estado !== "finalizada").forEach((o) => mapa.set(o.telar, o));
    return mapa;
  }, [ots]);

  const otActiva = telarAbierto !== null ? activas.get(telarAbierto) : undefined;

  function mostrarAviso(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(null), 3000);
  }

  function reemplazar(ot: OT | null) {
    if (ot) setOts((prev) => prev.map((o) => (o.id === ot.id ? ot : o)));
  }

  async function generar(datos: { motivo: Motivo; observacion: string }) {
    if (telarAbierto === null) return;
    const nueva = await crearOT({
      telar: telarAbierto,
      mecanico: nombre,
      usuario,
      ...datos,
    });
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
    reemplazar(await reanudarOT(ot.id, nombre));
    setTelarAbierto(null);
    mostrarAviso(`${ot.id} reanudada por ${nombre}`);
  }

  async function finalizar(
    ot: OT,
    datos: { trabajoRealizado: string; repuestos: Repuesto[] }
  ) {
    reemplazar(
      await finalizarOT(ot.id, {
        ...datos,
        por: nombre,
        personalAsignado: "",
      })
    );
    setTelarAbierto(null);
    mostrarAviso(`Telar ${ot.telar} operativo de nuevo`);
  }

  function manejarClickTelar(n: number) {
    if (novedadActiva) {
      const copia = { ...novedadesTelares };
      if (copia[n] === novedadActiva) {
        delete copia[n];
        mostrarAviso(`Se quitó la novedad del Telar ${n}`);
      } else {
        copia[n] = novedadActiva;
        mostrarAviso(`Telar ${n} marcado como: ${ETIQUETAS_NOVEDAD[novedadActiva].texto}`);
      }
      setNovedadesTelares(copia);
      guardarNovedades(copia);
      return;
    }
    setTelarAbierto(n);
  }

  function limpiarNovedadTelar(e: React.MouseEvent, n: number) {
    e.stopPropagation();
    const copia = { ...novedadesTelares };
    delete copia[n];
    setNovedadesTelares(copia);
    guardarNovedades(copia);
    mostrarAviso(`Novedad del Telar ${n} eliminada`);
  }

  const desde = area?.desde ?? 1;
  const hasta = area?.hasta ?? TOTAL;

  const numeros = Array.from(
    { length: hasta - desde + 1 },
    (_, i) => desde + i
  );

  const conteo: Record<Categoria, number> = { produccion: 0, falla: 0, apagado: 0 };
  numeros.forEach((n) => {
    const ot = activas.get(n);
    if (ot) conteo[MOTIVOS[ot.motivo].categoria] += 1;
  });
  const operativos = numeros.length - Object.values(conteo).reduce((a, b) => a + b, 0);

  const leyenda = [
    { nombre: "Operativos", punto: "bg-emerald-600", n: operativos },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
      nombre: CATEGORIAS[c].nombre,
      punto: CATEGORIAS[c].punto,
      n: conteo[c],
    })),
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${colorUsuario[usuario] ?? "bg-stone-900"}`}
            >
              {usuario === "mythos" ? "M" : usuario === "leonardo" ? "L" : "A"}
            </span>
            <div className="leading-tight">
              <p className="text-sm text-stone-500">
                {usuario === "todas" || usuario === "admin" ? "Administrador" : "Mecánico"}
              </p>
              <p className="font-semibold text-stone-900">{nombre}</p>
            </div>
          </div>
          <button
            onClick={onSalir}
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 inline-flex rounded-xl bg-stone-200 p-1">
          {(["telares", "historial"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              aria-pressed={vista === v}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                vista === v
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {vista === "telares" ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                {area?.titulo ?? "Todas las Áreas"}
              </h1>
              <p className="mt-1 text-stone-500">
                Telares {desde} – {hasta}. Selecciona una opción abajo para marcar entrega de turno o toca un telar para una OT.
              </p>
            </div>

            <PanelEntregaTurno
              novedadActiva={novedadActiva}
              onSeleccionarNovedad={setNovedadActiva}
            />

            <div className="mb-5 flex flex-wrap gap-2">
              {leyenda.map((l) => (
                <div
                  key={l.nombre}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-stone-900/5"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${l.punto}`} />
                  <span className="text-stone-600">{l.nombre}</span>
                  <span className="font-semibold text-stone-900">{l.n}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {numeros.map((n) => {
                const ot = activas.get(n);
                const novedad = novedadesTelares[n];

                let clases = cuadroOperativo;
                if (ot) {
                  clases = CATEGORIAS[MOTIVOS[ot.motivo].categoria].cuadro;
                } else if (novedad) {
                  clases = ETIQUETAS_NOVEDAD[novedad].colorCuadro;
                }

                const pausada = ot?.estado === "pausada";

                return (
                  <button
                    key={n}
                    onClick={() => manejarClickTelar(n)}
                    aria-label={`Telar ${n}`}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/30 ${clases} ${
                      pausada ? "ring-2 ring-stone-900 ring-offset-1" : ""
                    } ${novedadActiva ? "cursor-crosshair ring-2 ring-stone-900 ring-offset-1" : ""}`}
                  >
                    {n}
                    {ot && (
                      <span className="text-[10px] font-medium leading-none opacity-90">
                        {pausada ? "Pausa" : MOTIVOS[ot.motivo].corto}
                      </span>
                    )}
                    {!ot && novedad && (
                      <span className="text-[9px] font-bold leading-none mt-0.5 px-1 bg-black/30 rounded text-white truncate max-w-full">
                        {ETIQUETAS_NOVEDAD[novedad].corto}
                      </span>
                    )}

                    {!ot && novedad && !novedadActiva && (
                      <span
                        onClick={(e) => limpiarNovedadTelar(e, n)}
                        title="Limpiar novedad"
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white text-xs shadow hover:bg-red-600"
                      >
                        ×
                      </span>
                    )}
                  </button>
                );
              })}
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