const configuredContactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

/** Public contact address for account or order exceptions. */
export const CONTACT_EMAIL = configuredContactEmail || "contacto@valdra.store";

export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Pedido en curso — Valdra Store",
)}`;
