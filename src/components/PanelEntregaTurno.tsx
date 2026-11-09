// src/components/PanelEntregaTurno.tsx
import { ETIQUETAS_NOVEDAD, type NovedadTurno } from "../services/novedadesService";

type Props = {
  novedadActiva: NovedadTurno | null;
  onSeleccionarNovedad: (novedad: NovedadTurno | null) => void;
};

export default function PanelEntregaTurno({ novedadActiva, onSeleccionarNovedad }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-stone-900">⚡ Reporte / Entrega de Turno</p>
        {novedadActiva && (
          <button
            onClick={() => onSeleccionarNovedad(null)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Cancelar selección
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(ETIQUETAS_NOVEDAD) as NovedadTurno[]).map((key) => {
          const seleccionada = novedadActiva === key;
          return (
            <button
              key={key}
              onClick={() => onSeleccionarNovedad(seleccionada ? null : key)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                seleccionada
                  ? "bg-stone-900 text-white shadow-md ring-2 ring-stone-900 ring-offset-1"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {ETIQUETAS_NOVEDAD[key].texto}
            </button>
          );
        })}
      </div>

      {novedadActiva && (
        <div className="mt-3 flex items-center justify-between bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs font-medium text-amber-800">
          <span>
            👉 Modo activo: Toca los telares abajo para asignarles <strong>"{ETIQUETAS_NOVEDAD[novedadActiva].texto}"</strong>. Vuelve a tocarlos para desmarcar.
          </span>
        </div>
      )}
    </div>
  );
}