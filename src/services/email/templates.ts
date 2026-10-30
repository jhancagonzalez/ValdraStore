const FALLBACK_SERVER_URL = "http://localhost:3000";

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '"': "&quot;", "&": "&amp;", "'": "&#39;", "<": "&lt;", ">": "&gt;" })[character] ??
      character,
  );

export const getServerUrl = (): string =>
  (process.env.NEXT_PUBLIC_SERVER_URL ?? FALLBACK_SERVER_URL).replace(/\/+$/, "");

/**
 * Best available public base URL for links inside emails: the browser origin of
 * the request that triggered the mail, then the configured URL. Keeps production
 * links pointing at the deployed domain even if a variable is missing.
 */
export const resolveBaseUrl = (headers?: Headers | null): string => {
  const origin = headers?.get("origin");
  if (origin && origin !== "null") {
    return origin.replace(/\/+$/, "");
  }

  const host = headers?.get("host");
  if (host) {
    const protocol = headers?.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  return getServerUrl();
};

/** Absolute URL of the customer-facing reset screen (never the admin panel route). */
export const buildPasswordResetUrl = (token: string, baseUrl?: string): string =>
  `${(baseUrl ?? getServerUrl()).replace(/\/+$/, "")}/restablecer?token=${encodeURIComponent(token)}`;

type PasswordResetEmailArgs = {
  baseUrl?: string;
  name?: null | string;
  token: string;
};

export const passwordResetEmailHtml = ({
  baseUrl,
  name,
  token,
}: PasswordResetEmailArgs): string => {
  const url = buildPasswordResetUrl(token, baseUrl);
  const greeting = name ? `Hola, ${escapeHtml(name)}.` : "Hola.";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#0b0b10;color:#f2f2f7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:28px;border:1px solid #26263a;border-radius:14px;background:#15151f;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#9aa8ff;">Valdra Store</h1>
      <p style="margin:0 0 12px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 20px;line-height:1.6;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el
        siguiente enlace para crear una contraseña nueva.
      </p>
      <p style="margin:0 0 20px;">
        <a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#9aa8ff;color:#0b0b10;font-weight:600;text-decoration:none;">
          Crear una contraseña nueva
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#a8a8b8;font-size:14px;">
        El enlace vence en una hora y solo puede usarse una vez.
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#a8a8b8;font-size:14px;">
        Si no solicitaste este cambio, ignora este mensaje: tu contraseña actual sigue vigente.
      </p>
      <p style="margin:0;padding-top:16px;border-top:1px solid #26263a;color:#6c6c80;font-size:12px;word-break:break-all;">
        ${url}
      </p>
    </div>
  </body>
</html>`;
};
