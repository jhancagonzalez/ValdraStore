import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { EmailAdapter } from "payload";

type SmtpSettings = {
  fromAddress: string;
  fromName: string;
  host: string;
  pass: string;
  port: number;
  secure: boolean;
  user: string;
};

const readSmtpSettings = (): SmtpSettings | null => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromAddress = process.env.SMTP_FROM_ADDRESS?.trim() || user;

  if (!host || !user || !pass || !fromAddress) {
    return null;
  }

  const parsedPort = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const port = Number.isFinite(parsedPort) ? parsedPort : 587;
  const secureFlag = process.env.SMTP_SECURE?.trim();

  return {
    fromAddress,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Valdra Store",
    host,
    pass,
    port,
    secure: secureFlag ? secureFlag === "true" : port === 465,
    user,
  };
};

/**
 * Builds the Payload email adapter used by HU-03.
 *
 * Any SMTP provider works (Brevo is the approved channel); only the SMTP_*
 * variables change. With no credentials the adapter stays undefined and Payload
 * writes messages to the server console, so local work is never blocked. Set
 * SMTP_USE_ETHEREAL=true to capture those messages in a temporary Ethereal inbox
 * during development.
 */
export const createEmailAdapter = (): EmailAdapter | Promise<EmailAdapter> | undefined => {
  const settings = readSmtpSettings();

  if (settings) {
    return nodemailerAdapter({
      defaultFromAddress: settings.fromAddress,
      defaultFromName: settings.fromName,
      transportOptions: {
        auth: { pass: settings.pass, user: settings.user },
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
      },
    });
  }

  if (process.env.SMTP_USE_ETHEREAL === "true") {
    return nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS?.trim() || "no-reply@valdra.local",
      defaultFromName: process.env.SMTP_FROM_NAME?.trim() || "Valdra Store",
    });
  }

  // Without credentials Payload logs its own warning and writes mail to the console.
  return undefined;
};
