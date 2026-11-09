import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Telares from "./pages/Telares";
import type { Usuario } from "./types";

type SesionActiva = {
  nombre: string;
  usuario: Usuario;
};

export default function App() {
  const [sesion, setSesion] = useState<SesionActiva | null>(null);

  // Recuperar sesión persistente al abrir o recargar el navegador
  useEffect(() => {
    const raw = localStorage.getItem("toptex_sesion");
    if (raw) {
      try {
        setSesion(JSON.parse(raw));
      } catch {
        localStorage.removeItem("toptex_sesion");
      }
    }
  }, []);

  function handleEntrar(nombre: string, usuario: Usuario) {
    const nuevaSesion: SesionActiva = { nombre, usuario };
    setSesion(nuevaSesion);
    localStorage.setItem("toptex_sesion", JSON.stringify(nuevaSesion));
  }

  function handleSalir() {
    setSesion(null);
    localStorage.removeItem("toptex_sesion");
  }

  if (!sesion) {
    return <Login onEntrar={handleEntrar} />;
  }

  return (
    <Telares
      nombre={sesion.nombre}
      usuario={sesion.usuario}
      onSalir={handleSalir}
    />
  );
}