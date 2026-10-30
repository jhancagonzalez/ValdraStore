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
 * Absolute URL of the customer-facing reset screen (never the admin panel route).
 * The base URL always comes from configuration: deriving it from request headers
 * would let an attacker poison the link sent by email.
 */
export const buildPasswordResetUrl = (token: string): string =>
  `${getServerUrl()}/restablecer?token=${encodeURIComponent(token)}`;

type PasswordResetEmailArgs = {
  name?: null | string;
  token: string;
};

export const passwordResetEmailHtml = ({ name, token }: PasswordResetEmailArgs): string => {
  const url = buildPasswordResetUrl(token);
  const safeUrl = escapeHtml(url);
  const greeting = name ? `Hola, ${escapeHtml(name)}.` : "Hola.";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4f4f2;color:#0d0d0d;font-family:'Space Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px;border:1px solid #e5e5e2;background:#ffffff;">
      <p style="margin:0 0 24px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">Valdra Store</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:500;letter-spacing:-0.02em;line-height:1.15;">Restablece tu contraseña</h1>
      <p style="margin:0 0 12px;line-height:1.6;color:#333333;">${greeting}</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#333333;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el
        siguiente enlace para crear una contraseña nueva.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${safeUrl}" style="display:inline-block;padding:14px 24px;background:#0d0d0d;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:0.14em;text-decoration:none;text-transform:uppercase;">
          Crear una contraseña nueva
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#6f6f6f;font-size:13px;">
        El enlace vence en una hora y solo puede usarse una vez.
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#6f6f6f;font-size:13px;">
        Si no solicitaste este cambio, ignora este mensaje: tu contraseña actual sigue vigente.
      </p>
      <p style="margin:0;padding-top:16px;border-top:1px solid #e5e5e2;color:#6f6f6f;font-size:11px;word-break:break-all;">
        ${safeUrl}
      </p>
    </div>
  </body>
</html>`;
};
