import { useEffect, useMemo, useRef, useState } from "react";

export const OPERARIOS_FIJOS: string[] = [
  "Jhon Hoyos",
  "Edilberto",
  "Josué",
  "Miriam",
  "Carlos",
  "Juan",
  "Luis",
  "Andrés",
];

type Props = {
  value: string; // Cadena separada por comas, ej: "Jhon Hoyos, Edilberto"
  onChange: (nuevoValor: string) => void;
  operarioSesion?: string;
  label?: string;
};

export default function SelectorOperarios({
  value,
  onChange,
  operarioSesion,
  label = "Trabajo realizado por",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  // Lista fija de operarios (incluyendo al mecánico en sesión si no estuviera en la lista base)
  const listaOperarios = useMemo(() => {
    const base = [...OPERARIOS_FIJOS];
    if (
      operarioSesion &&
      operarioSesion.trim() !== "" &&
      !base.some((op) => op.toLowerCase() === operarioSesion.trim().toLowerCase())
    ) {
      base.unshift(operarioSesion.trim());
    }
    return base;
  }, [operarioSesion]);

  // Convertimos la cadena separada por comas en un arreglo limpio de nombres seleccionados
  const seleccionados = useMemo(() => {
    if (!value || !value.trim()) return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Cerrar el menú desplegable al tocar fuera
  useEffect(() => {
    function manejarClickFuera(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  function alternarOperario(nombre: string) {
    const existe = seleccionados.includes(nombre);
    const siguienteLista = existe
      ? seleccionados.filter((item) => item !== nombre)
      : [...seleccionados, nombre];

    // Unimos los nombres en una sola cadena separada por comas (ej. "Jhon Hoyos, Edilberto")
    onChange(siguienteLista.join(", "));
  }

  return (
    <div ref={contenedorRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}
      </label>

      {/* Botón disparador del dropdown */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex min-h-13 w-full items-center justify-between gap-3 rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-left text-base text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white focus:ring-4 focus:ring-stone-900/10"
      >
        <span
          className={
            seleccionados.length > 0
              ? "font-semibold text-stone-900 truncate"
              : "text-stone-400"
          }
        >
          {seleccionados.length > 0
            ? value
            : "Seleccionar operarios (ej: Jhon Hoyos, Edilberto)..."}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {seleccionados.length > 0 && (
            <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-bold text-white">
              {seleccionados.length}
            </span>
          )}
          <svg
            className={`h-5 w-5 text-stone-500 transition-transform duration-200 ${
              abierto ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Menú desplegable con checkboxes grandes para pantallas móviles */}
      {abierto && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-stone-300 bg-white p-2 shadow-xl ring-1 ring-stone-900/5"
        >
          <div className="space-y-1.5">
            {listaOperarios.map((nombre) => {
              const marcado = seleccionados.includes(nombre);
              return (
                <label
                  key={nombre}
                  className={`flex min-h-13 cursor-pointer items-center gap-3.5 rounded-xl px-3.5 py-3 text-base font-semibold transition select-none active:scale-[0.99] ${
                    marcado
                      ? "bg-stone-900 text-white"
                      : "bg-stone-50 text-stone-800 hover:bg-stone-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarOperario(nombre)}
                    className="h-6 w-6 shrink-0 cursor-pointer rounded-md border-2 border-stone-300 accent-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="flex-1">{nombre}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 px-1">
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-red-600"
            >
              Limpiar selección
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
