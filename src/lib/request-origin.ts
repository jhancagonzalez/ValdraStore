/**
 * Rechaza peticiones que llegan desde otro sitio antes de ejecutar una acción
 * con sesión (HU-17). `sec-fetch-site` cubre los navegadores actuales; `Origin`
 * cubre el resto y falla cerrado si no es una URL válida.
 */
export const hasValidOrigin = (request: Request): boolean => {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>();

  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    return false;
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  if (serverUrl) {
    try {
      allowedOrigins.add(new URL(serverUrl).origin);
    } catch {
      return false;
    }
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
};
