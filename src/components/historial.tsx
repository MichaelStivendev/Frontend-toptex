import { useMemo, useState } from "react";
import {
  CATEGORIAS,
  MOTIVOS,
  MOTIVOS_PAUSA,
  calcularTiempos,
  formatoDuracion,
  formatoFecha,
} from "../types";
import type { Categoria, Motivo, OT } from "../types";

type Props = {
  ots: OT[];
  desde: number;
  hasta: number;
};

const estados = {
  abierta: { texto: "En curso", clases: "bg-blue-100 text-blue-800" },
  pausada: { texto: "En pausa", clases: "bg-yellow-100 text-yellow-800" },
  finalizada: { texto: "Finalizada", clases: "bg-emerald-100 text-emerald-800" },
};

export default function Historial({ ots, desde, hasta }: Props) {
  const [filtro, setFiltro] = useState<"todas" | Categoria>("todas");

  const lista = useMemo(
    () =>
      ots
        .filter((o) => o.telar >= desde && o.telar <= hasta)
        .filter((o) => filtro === "todas" || MOTIVOS[o.motivo].categoria === filtro)
        .sort((a, b) => b.creada.localeCompare(a.creada)),
    [ots, desde, hasta, filtro]
  );

  // Resumen por motivo: cuántas veces y cuánto tiempo
  const resumen = useMemo(() => {
    const mapa = new Map<Motivo, { n: number; ms: number }>();
    lista.forEach((o) => {
      const actual = mapa.get(o.motivo) ?? { n: 0, ms: 0 };
      actual.n += 1;
      actual.ms += calcularTiempos(o).total;
      mapa.set(o.motivo, actual);
    });
    return [...mapa.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [lista]);

  const filtros: { id: "todas" | Categoria; nombre: string }[] = [
    { id: "todas", nombre: "Todas" },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
      id: c,
      nombre: CATEGORIAS[c].nombre,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Filtros de Categorías */}
      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
              filtro === f.id
                ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-500 hover:bg-stone-50"
            }`}
          >
            {f.nombre}
          </button>
        ))}
      </div>

      {/* Resumen Métrico Superior */}
      {resumen.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {resumen.map(([motivo, r]) => (
            <div
              key={motivo}
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm border border-stone-200/80 shadow-sm"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  CATEGORIAS[MOTIVOS[motivo].categoria].punto
                }`}
              />
              <span className="font-semibold text-stone-900">
                {MOTIVOS[motivo].nombre}
              </span>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-600">
                {r.n} ({formatoDuracion(r.ms)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de Órdenes de Trabajo */}
      {lista.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          Todavía no hay OT registradas en este rango.
        </p>
      ) : (
        <div className="space-y-2.5">
          {lista.map((o) => {
            const cat = CATEGORIAS[MOTIVOS[o.motivo].categoria];
            const t = calcularTiempos(o);
            const est = estados[o.estado];
            const personalRealizador = o.personalAsignado || o.finalizadaPor;

            return (
              <details
                key={o.id}
                className="group rounded-2xl border border-stone-200 bg-white transition hover:border-stone-300 shadow-sm overflow-hidden"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${cat.punto}`} />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900">
                        Telar {o.telar}
                      </p>
                      <span className="text-stone-300">·</span>
                      <p className="font-semibold text-stone-800 truncate">
                        {MOTIVOS[o.motivo].nombre}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {o.id} · {formatoFecha(o.creada)} · Abrió: {o.mecanico}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${est.clases}`}
                      >
                        {est.texto}
                      </span>
                      <p className="mt-1 text-xs font-medium text-stone-500">
                        {formatoDuracion(t.total)}
                      </p>
                    </div>

                    {/* Chevron que rota al desplegar */}
                    <svg
                      className="h-5 w-5 text-stone-400 transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>

                {/* Contenido expandible */}
                <div className="space-y-3.5 border-t border-stone-100 bg-stone-50/50 p-4 text-sm text-stone-800">
                  {/* Observación inicial */}
                  {o.observacion && (
                    <div className="rounded-xl bg-white p-3 border border-stone-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Observación inicial
                      </p>
                      <p className="mt-1 text-stone-800">{o.observacion}</p>
                    </div>
                  )}

                  {/* Trabajo Realizado y Personal que intervino */}
                  {o.trabajoRealizado && (
                    <div className="rounded-xl bg-white p-3 border border-stone-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Trabajo realizado / Solución
                      </p>
                      <p className="mt-1 font-medium text-stone-900">
                        {o.trabajoRealizado}
                      </p>
                      
                      {personalRealizador && (
                        <p className="mt-2 text-xs text-stone-500 border-t border-stone-100 pt-2">
                          <span className="font-semibold text-stone-700">Realizado por:</span>{" "}
                          {personalRealizador}
                          {o.finalizada && ` · ${formatoFecha(o.finalizada)}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Repuestos Usados */}
                  {o.repuestos && o.repuestos.length > 0 && (
                    <div className="rounded-xl bg-white p-3 border border-stone-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                        Repuestos instalados
                      </p>
                      <ul className="space-y-1">
                        {o.repuestos.map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-stone-800">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-stone-700">
                              {r.cantidad}×
                            </span>
                            <span>{r.nombre}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detalle de Tiempos */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 pt-1">
                    <span>
                      <strong className="text-stone-700">Tiempo total:</strong> {formatoDuracion(t.total)}
                    </span>
                    {o.pausas.length > 0 && (
                      <div className="flex gap-3">
                        <span>
                          <strong className="text-yellow-700">Pausado:</strong> {formatoDuracion(t.pausado)}
                        </span>
                        <span>
                          <strong className="text-emerald-700">Trabajado:</strong> {formatoDuracion(t.trabajado)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Historial de Pausas */}
                  {o.pausas.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Historial de pausas
                      </p>
                      {o.pausas.map((p, i) => (
                        <div key={i} className="rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-900 border border-amber-200/50">
                          <span className="font-bold">
                            {MOTIVOS_PAUSA[p.motivo]}
                          </span>
                          <span className="text-stone-600 block sm:inline sm:ml-2">
                            Pausó {p.pausadaPor} ({formatoFecha(p.desde)})
                            {p.hasta && ` · Reanudó ${p.reanudadaPor} (${formatoFecha(p.hasta)})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}