// src/hooks/useAutoUpdate.ts
import { useEffect } from "react";

declare const __APP_VERSION__: string;

const INTERVALO_VERIFICACION_MS = 45_000; // Verifica cada 45 segundos

/**
 * Detecta automáticamente cuando Vercel despliega una nueva compilación
 * (vía /version.json y Service Worker) y refresca la aplicación en tablets y teléfonos
 * en cuanto tienen conexión a la red.
 */
export function useAutoUpdate() {
  useEffect(() => {
    // En desarrollo local Vite ya cuenta con Hot Module Replacement (HMR)
    if (!import.meta.env.PROD) return;

    let recargando = false;

    const recargarAplicacion = async (nuevaVersion?: string) => {
      if (recargando) return;

      // Evita bucles infinitos de recarga si el navegador sirve caché intermedio
      if (nuevaVersion) {
        const ultimaRecargada = sessionStorage.getItem("toptex_version_recargada");
        if (ultimaRecargada === nuevaVersion) return;
        sessionStorage.setItem("toptex_version_recargada", nuevaVersion);
      }

      recargando = true;

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((reg) => reg.update().catch(() => {})));
        }
      } catch {
        // Ignorar errores de actualización del SW antes de recargar
      }

      window.location.reload();
    };

    const verificarNuevaVersion = async () => {
      if (!navigator.onLine || recargando) return;

      try {
        // 1. Verificar archivo version.json generado en cada build de Vercel
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (res.ok) {
          const data: { version?: string } = await res.json();
          if (
            data?.version &&
            typeof __APP_VERSION__ !== "undefined" &&
            data.version !== __APP_VERSION__
          ) {
            await recargarAplicacion(data.version);
            return;
          }
        }

        // 2. Pedir al Service Worker que busque actualizaciones en segundo plano
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          }
        }
      } catch {
        // Si la tablet pierde señal momentáneamente, reintentará en el próximo ciclo o evento 'online'
      }
    };

    // Si el Service Worker toma control con una nueva versión, refrescar inmediatamente
    const onControllerChange = () => {
      recargarAplicacion();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    // Verificar al volver a tener red en la planta o al encender la pantalla de la tablet
    const onOnline = () => {
      void verificarNuevaVersion();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verificarNuevaVersion();
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Verificación inicial y periódica
    void verificarNuevaVersion();
    const timer = window.setInterval(() => {
      void verificarNuevaVersion();
    }, INTERVALO_VERIFICACION_MS);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
    };
  }, []);
}
