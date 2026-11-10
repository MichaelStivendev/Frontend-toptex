import { useMemo, useState } from "react";
import {
  CATEGORIAS,
  calcularTiempos,
  formatoDuracion,
  formatoFecha,
  obtenerInfoMotivo,
  obtenerTextoMotivoPausa,
} from "../types";
import type { Categoria, OT } from "../types";

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
  const [busquedaTelar, setBusquedaTelar] = useState("");

  const lista = useMemo(
    () =>
      (Array.isArray(ots) ? ots : [])
        .filter((o) => o && o.telar >= desde && o.telar <= hasta)
        .filter((o) => filtro === "todas" || obtenerInfoMotivo(o.motivo).categoria === filtro)
        .sort((a, b) => String(b.creada ?? "").localeCompare(String(a.creada ?? ""))),
    [ots, desde, hasta, filtro]
  );

  // Variable derivada que filtra en tiempo real por número de telar (convertido a String)
  const listaFiltrada = useMemo(() => {
    const termino = busquedaTelar.trim();
    if (!termino) return lista;
    return lista.filter((o) => String(o.telar).includes(termino));
  }, [lista, busquedaTelar]);

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

      {/* Buscador por número de telar (UX para planta: teclado numérico, p-4, texto grande y botón X) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={busquedaTelar}
            onChange={(e) => setBusquedaTelar(e.target.value)}
            placeholder="Buscar por número de telar (ej: 145)..."
            aria-label="Buscar por número de telar"
            className="w-full rounded-2xl border border-stone-300 bg-white p-4 pr-14 text-lg font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 shadow-sm outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {busquedaTelar && (
            <button
              type="button"
              onClick={() => setBusquedaTelar("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-200 text-lg font-bold text-stone-700 transition hover:bg-stone-300 active:scale-95"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de Órdenes de Trabajo */}
      {listaFiltrada.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          {busquedaTelar.trim()
            ? `No hay resultados para el telar "${busquedaTelar}".`
            : "No hay resultados en este rango."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {listaFiltrada.map((o) => {
            const infoMotivo = obtenerInfoMotivo(o.motivo);
            const cat = CATEGORIAS[infoMotivo.categoria];
            const t = calcularTiempos(o);
            const est = estados[o.estado] ?? estados.abierta;
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
                        {infoMotivo.nombre}
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
                    {(o.pausas?.length ?? 0) > 0 && (
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
                  {(o.pausas?.length ?? 0) > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Historial de pausas
                      </p>
                      {(o.pausas ?? []).map((p, i) => (
                        <div key={i} className="rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-900 border border-amber-200/50">
                          <span className="font-bold">
                            {obtenerTextoMotivoPausa(p?.motivo)}
                          </span>
                          <span className="text-stone-600 block sm:inline sm:ml-2">
                            Pausó {p?.pausadaPor} ({formatoFecha(p?.desde)})
                            {p?.hasta && ` · Reanudó ${p?.reanudadaPor} (${formatoFecha(p.hasta)})`}
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
