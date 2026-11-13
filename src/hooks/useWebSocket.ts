import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface UseWebSocketReturn<T = unknown> {
  status: WebSocketStatus;
  data: T | null;
  send: (payload: unknown) => boolean;
}

const BASE_DELAY_MS = 1000; // 1s inicial
const MAX_DELAY_MS = 10000; // Tope máximo de 10s

export function useWebSocket<T = unknown>(
  url: string | null,
  onMessage?: (data: T) => void
): UseWebSocketReturn<T> {
  const [status, setStatus] = useState<WebSocketStatus>(
    url ? "connecting" : "disconnected"
  );
  const [data, setData] = useState<T | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const onMessageRef = useRef<((data: T) => void) | undefined>(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const send = useCallback((payload: unknown): boolean => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket no está conectado. No se pudo enviar el mensaje.");
      return false;
    }

    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    socket.send(message);
    return true;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!url) {
      setStatus("disconnected");
      return;
    }

    const clearReconnectTimer = () => {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const connect = (isRetry = false) => {
      if (!isMountedRef.current) return;

      clearReconnectTimer();

      // Cerrar cualquier instancia previa antes de abrir una nueva para evitar sockets huérfanos
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setStatus(isRetry ? "reconnecting" : "connecting");

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;
      } catch (err) {
        console.error("Error al instanciar WebSocket:", err);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        if (!isMountedRef.current || wsRef.current !== ws) return;
        retryCountRef.current = 0; // Reiniciamos el contador de Exponential Backoff al conectar
        setStatus("connected");
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current || wsRef.current !== ws) return;
        let parsed: T;
        try {
          parsed = JSON.parse(event.data) as T;
        } catch {
          // Si el mensaje no es JSON válido, entregamos el valor directo
          parsed = event.data as unknown as T;
        }
        setData(parsed);
        onMessageRef.current?.(parsed);
      };

      ws.onerror = (error) => {
        if (!isMountedRef.current || wsRef.current !== ws) return;
        console.error("Error en conexión WebSocket:", error);
      };

      ws.onclose = () => {
        if (!isMountedRef.current || wsRef.current !== ws) return;
        setStatus("disconnected");
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (!isMountedRef.current) return;

      clearReconnectTimer();

      // Exponential Backoff: 1s, 2s, 4s, 8s, máximo 10s
      const attempt = retryCountRef.current;
      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, attempt),
        MAX_DELAY_MS
      );
      retryCountRef.current = attempt + 1;

      setStatus("reconnecting");

      reconnectTimeoutRef.current = setTimeout(() => {
        connect(true);
      }, delay);
    };

    // Si la tablet recupera la red Wi-Fi, reconectamos de inmediato sin esperar al timer
    const handleOnline = () => {
      if (!isMountedRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        retryCountRef.current = 0;
        connect(true);
      }
    };

    window.addEventListener("online", handleOnline);
    connect(false);

    // Cleanup al desmontar o cambiar de URL: evita fugas de memoria y sockets huérfanos
    return () => {
      isMountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      clearReconnectTimer();

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]);

  return { status, data, send };
}
