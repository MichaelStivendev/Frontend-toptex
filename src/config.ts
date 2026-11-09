export const API_URL = (
  import.meta.env.VITE_API_URL || "https://backend-moonlit.fly.dev"
).replace(/\/$/, "");

export const WS_URL = (
  import.meta.env.VITE_WS_URL || "wss://backend-moonlit.fly.dev"
).replace(/\/$/, "");
