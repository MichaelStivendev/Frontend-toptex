import { useEffect, useState } from "react";
import {
  CATEGORIAS,
  MOTIVOS,
  MOTIVOS_PAUSA,
  calcularTiempos,
  formatoDuracion,
  formatoFecha,
} from "../types";
import type { MotivoPausa, OT, Repuesto } from "../types";

type Props = {
  ot: OT;
  mecanico: string; // quien tiene la sesión (pausa / reanuda / finaliza)
  onCerrar: () => void;
  onPausar: (motivo: MotivoPausa) => void;
  onReanudar: () => void;
  // Actualizamos el tipo para incluir el personal
  onFinalizar: (datos: {
    trabajoRealizado: string;
    personalAsignado: string;
    repuestos: Repuesto[];
  }) => void;
};

// text-base (16px) evita el zoom automático de iOS al enfocar un input
const campo =
  "w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10";

// Barra de acciones fija abajo, respeta el área segura del iPhone
const barraAcciones =
  "sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-stone-100 bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6";

const btnBase =
  "min-h-12 flex-1 rounded-xl px-4 py-3 text-base font-semibold transition";
const btnSecundario = `${btnBase} border border-stone-300 text-stone-700 hover:bg-stone-100 active:bg-stone-200`;

export default function OTDetalle({
  ot,
  mecanico,
  onCerrar,
  onPausar,
  onReanudar,
  onFinalizar,
}: Props) {
  const [modo, setModo] = useState<"detalle" | "pausar" | "finalizar">("detalle");
  const [ahora, setAhora] = useState(Date.now());
  const [motivoPausa, setMotivoPausa] = useState<MotivoPausa | null>(null);
  const [trabajo, setTrabajo] = useState("");
  
  // Nuevo estado para el personal que hizo/cerró la OT (inicia con el mecánico de la sesión por defecto)
  const [personalAsignado, setPersonalAsignado] = useState(mecanico);

  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [repNombre, setRepNombre] = useState("");
  const [repCantidad, setRepCantidad] = useState("1");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(t);
    };
  }, [onCerrar]);

  const cat = CATEGORIAS[MOTIVOS[ot.motivo].categoria];
  const tiempos = calcularTiempos(ot, ahora);
  const pausada = ot.estado === "pausada";
  const pausaActual = pausada ? ot.pausas[ot.pausas.length - 1] : undefined;

  function ajustarCantidad(delta: number) {
    const actual = Math.max(1, Number(repCantidad) || 1);
    setRepCantidad(String(Math.max(1, actual + delta)));
  }

  function agregarRepuesto() {
    if (!repNombre.trim()) return;
    setRepuestos((r) => [
      ...r,
      {
        nombre: repNombre.trim().replace(/\s+/g, " "),
        cantidad: Math.max(1, Number(repCantidad) || 1),
      },
    ]);
    setRepNombre("");
    setRepCantidad("1");
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="det-titulo"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-5 pt-5 shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl sm:px-6 sm:pt-6"
      >
        {/* Asa visual de hoja inferior (solo móvil) */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-200 sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="det-titulo" className="text-xl font-bold text-stone-900">
              Telar {ot.telar}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cat.punto}`} />
              <span className="truncate">
                {ot.id} · {pausada ? "En pausa" : "En curso"}
              </span>
            </p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200"
          >
            ×
          </button>
        </div>

        {/* ---------- DETALLE ---------- */}
        {modo === "detalle" && (
          <>
            <dl className="space-y-3 rounded-2xl bg-stone-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Motivo</dt>
                <dd className="text-right font-semibold text-stone-900">
                  {MOTIVOS[ot.motivo].nombre}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Desde</dt>
                <dd className="text-right font-medium text-stone-900">
                  {formatoFecha(ot.creada)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Abrió</dt>
                <dd className="text-right font-medium text-stone-900">
                  {ot.mecanico}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Tiempo total</dt>
                <dd className="text-right font-medium text-stone-900">
                  {formatoDuracion(tiempos.total)}
                </dd>
              </div>
              {ot.pausas.length > 0 && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">En pausa</dt>
                    <dd className="text-right font-medium text-stone-900">
                      {formatoDuracion(tiempos.pausado)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">Trabajado</dt>
                    <dd className="text-right font-medium text-stone-900">
                      {formatoDuracion(tiempos.trabajado)}
                    </dd>
                  </div>
                </>
              )}
              {ot.observacion && (
                <div>
                  <dt className="text-stone-500">Observación</dt>
                  <dd className="mt-1 break-words text-stone-900">
                    {ot.observacion}
                  </dd>
                </div>
              )}
            </dl>

            {ot.pausas.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-stone-700">Pausas</p>
                <ul className="space-y-2 text-sm">
                  {ot.pausas.map((p, i) => (
                    <li key={i} className="rounded-xl bg-yellow-50 px-3 py-2.5">
                      <p className="font-semibold text-yellow-900">
                        {MOTIVOS_PAUSA[p.motivo]}
                      </p>
                      <p className="text-stone-600">
                        Pausó {p.pausadaPor} · {formatoFecha(p.desde)}
                      </p>
                      {p?.hasta ? (
                        <p className="text-stone-600">
                          Reanudó {p.reanudadaPor} · {formatoFecha(p.hasta)}
                        </p>
                      ) : (
                        <p className="text-yellow-800">Sigue en pausa</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pausaActual && (
              <p className="mt-4 text-center text-xs text-stone-500">
                Pausada por {pausaActual.pausadaPor}:{" "}
                {MOTIVOS_PAUSA[pausaActual.motivo].toLowerCase()}
              </p>
            )}

            <div className={barraAcciones}>
              {pausada ? (
                <button
                  onClick={onReanudar}
                  className={`${btnBase} bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/30`}
                >
                  Reanudar como {mecanico}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setModo("pausar")}
                    className={btnSecundario}
                  >
                    Pausar
                  </button>
                  <button
                    onClick={() => setModo("finalizar")}
                    className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30`}
                  >
                    Finalizar OT
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ---------- PAUSAR ---------- */}
        {modo === "pausar" && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-stone-700">
                ¿Por qué se pausa?
              </legend>
              <div className="space-y-2">
                {(Object.keys(MOTIVOS_PAUSA) as MotivoPausa[]).map((m) => (
                  <label key={m} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="pausa"
                      checked={motivoPausa === m}
                      onChange={() => setMotivoPausa(m)}
                      className="peer sr-only"
                    />
                    <div className="min-h-12 rounded-xl border border-stone-200 px-4 py-3.5 text-base font-semibold text-stone-900 transition hover:border-stone-400 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 peer-checked:ring-2 peer-checked:ring-yellow-500/20 peer-focus-visible:ring-4 peer-focus-visible:ring-stone-900/20">
                      {MOTIVOS_PAUSA[m]}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={barraAcciones}>
              <button onClick={() => setModo("detalle")} className={btnSecundario}>
                Volver
              </button>
              <button
                disabled={!motivoPausa}
                onClick={() => motivoPausa && onPausar(motivoPausa)}
                className={`${btnBase} bg-stone-900 text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300`}
              >
                Pausar OT
              </button>
            </div>
          </>
        )}

        {/* ---------- FINALIZAR ---------- */}
        {modo === "finalizar" && (
          <>
            <div className="space-y-5">
              {/* Trabajo realizado */}
              <div>
                <label
                  htmlFor="trabajo"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  ¿Qué se le hizo al telar? (obligatorio)
                </label>
                <textarea
                  id="trabajo"
                  rows={3}
                  value={trabajo}
                  onChange={(e) => setTrabajo(e.target.value)}
                  placeholder="Ej: Se cambió el sensor de trama y se calibró"
                  className={`${campo} resize-none`}
                />
              </div>

              {/* Personal Asignado / Participantes */}
              <div>
                <label
                  htmlFor="personal-asignado"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Personal que intervino (Ej: Mecánico y Producción)
                </label>
                <input
                  id="personal-asignado"
                  type="text"
                  value={personalAsignado}
                  onChange={(e) => setPersonalAsignado(e.target.value)}
                  placeholder="Ej: Josué y Miriam (Picando peine)"
                  autoComplete="off"
                  className={campo}
                />
              </div>

              {/* ---- Repuestos ---- */}
              <div>
                <label
                  htmlFor="rep-nombre"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Repuestos usados (opcional)
                </label>

                <div className="space-y-3 rounded-2xl bg-stone-50 p-3">
                  <input
                    id="rep-nombre"
                    value={repNombre}
                    onChange={(e) => setRepNombre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarRepuesto();
                      }
                    }}
                    placeholder="Ej: Rodamiento 6005 · Retenedor 40 60 7"
                    enterKeyHint="done"
                    autoComplete="off"
                    className={campo}
                  />

                  <div className="flex items-stretch gap-3">
                    <div
                      className="flex items-stretch overflow-hidden rounded-xl border border-stone-300 bg-white"
                      role="group"
                      aria-label="Cantidad"
                    >
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(-1)}
                        aria-label="Menos"
                        className="w-12 text-2xl text-stone-700 transition active:bg-stone-200"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={repCantidad}
                        onChange={(e) => setRepCantidad(e.target.value)}
                        aria-label="Cantidad"
                        className="w-12 border-x border-stone-200 bg-white text-center text-base font-semibold text-stone-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(1)}
                        aria-label="Más"
                        className="w-12 text-2xl text-stone-700 transition active:bg-stone-200"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={agregarRepuesto}
                      disabled={!repNombre.trim()}
                      className="min-h-12 flex-1 rounded-xl bg-stone-900 px-4 text-base font-semibold text-white transition hover:bg-stone-700 active:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {repuestos.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {repuestos.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white py-2 pl-3 pr-1"
                      >
                        <span className="mt-0.5 shrink-0 rounded-lg bg-stone-900 px-2 py-0.5 text-sm font-bold text-white">
                          {r.cantidad}×
                        </span>
                        <span className="min-w-0 flex-1 break-words py-0.5 text-base text-stone-900">
                          {r.nombre}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRepuestos((prev) => prev.filter((_, j) => j !== i))
                          }
                          aria-label={`Quitar ${r.nombre}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-stone-400 transition hover:text-red-600 active:bg-stone-100"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={barraAcciones}>
              <button onClick={() => setModo("detalle")} className={btnSecundario}>
                Volver
              </button>
              <button
                disabled={!trabajo.trim()}
                onClick={() =>
                  onFinalizar({
                    trabajoRealizado: trabajo.trim(),
                    personalAsignado: personalAsignado.trim(),
                    repuestos,
                  })
                }
                className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300`}
              >
                Finalizar OT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}