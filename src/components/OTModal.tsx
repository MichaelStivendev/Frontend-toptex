import { useEffect, useState } from "react";
import { CATEGORIAS, MOTIVOS, motivosDe } from "../types";
import type { Categoria, Motivo } from "../types";

type Props = {
  telar: number;
  mecanico: string;
  onCerrar: () => void;
  onGenerar: (datos: { motivo: Motivo; observacion: string }) => void;
};

export default function OTModal({ telar, mecanico, onCerrar, onGenerar }: Props) {
  const [categoria, setCategoria] = useState<Categoria>("produccion");
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [motivoOtroTexto, setMotivoOtroTexto] = useState("");
  const [observacion, setObservacion] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  const cat = CATEGORIAS[categoria];
  const esOtro = motivo === "Otro" || motivo === "otra_falla";
  const motivosCategoria: Motivo[] =
    categoria === "apagado"
      ? motivosDe(categoria)
      : [...motivosDe(categoria).filter((m) => m !== "Otro"), "Otro"];

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ot-titulo"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="ot-titulo" className="text-xl font-bold text-stone-900">
              Telar {telar}
            </h2>
            <p className="mt-1 text-sm text-stone-500">Mecánico: {mecanico}</p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (motivo) {
              const motivoFinal: Motivo = esOtro
                ? motivoOtroTexto.trim() || "Otro"
                : motivo;
              onGenerar({
                motivo: motivoFinal,
                observacion: observacion.trim(),
              });
            }
          }}
          className="space-y-5"
        >
          {/* Categoría */}
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">
              ¿Qué pasó con el telar?
            </p>
            <div role="tablist" className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
                <button
                  type="button"
                  role="tab"
                  key={c}
                  aria-selected={categoria === c}
                  onClick={() => {
                    setCategoria(c);
                    setMotivo(null);
                    setMotivoOtroTexto("");
                  }}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/20 ${
                    categoria === c
                      ? CATEGORIAS[c].pestana
                      : "border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}
                >
                  {CATEGORIAS[c].nombre}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">{cat.descripcion}</p>
          </div>

          {/* Motivos de la categoría */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">
              Motivo
            </legend>
            <div className="space-y-2">
              {motivosCategoria.map((m) => (
                <label key={m} className="block cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    checked={motivo === m}
                    onChange={() => setMotivo(m)}
                    className="peer sr-only"
                  />
                  <div
                    className={`rounded-xl border border-stone-200 px-4 py-3 font-semibold text-stone-900 transition hover:border-stone-400 peer-focus-visible:ring-4 peer-focus-visible:ring-stone-900/20 ${cat.seleccion}`}
                  >
                    {MOTIVOS[m]?.nombre ?? m}
                  </div>
                </label>
              ))}
            </div>

            {esOtro && (
              <div className="mt-3">
                <label
                  htmlFor="motivo-otro-ot"
                  className="mb-1.5 block text-xs font-semibold text-stone-700"
                >
                  Especifica el motivo:
                </label>
                <input
                  id="motivo-otro-ot"
                  type="text"
                  autoFocus
                  value={motivoOtroTexto}
                  onChange={(e) => setMotivoOtroTexto(e.target.value)}
                  placeholder="Escribe el motivo..."
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10"
                />
              </div>
            )}
          </fieldset>

          <div>
            <label
              htmlFor="observacion"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Observación (opcional)
            </label>
            <textarea
              id="observacion"
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej: Se cortó el hilo cerca del peine"
              className="w-full resize-none rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!motivo}
              className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:hover:bg-stone-300 ${cat.boton}`}
            >
              Generar OT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}