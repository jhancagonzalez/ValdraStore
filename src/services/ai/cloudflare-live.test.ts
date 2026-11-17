import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateDesignProposal } from "./proposal";

/**
 * Prueba de integración real con Cloudflare Workers AI (HU-14).
 * Se ejecuta solo cuando `.env.local` define CLOUDFLARE_ACCOUNT_ID y
 * CLOUDFLARE_API_TOKEN; en CI sin credenciales queda omitida, nunca simulada.
 */
const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const hasCredentials = Boolean(
  process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN,
);

const describeLive = hasCredentials ? describe : describe.skip;

describeLive("Cloudflare Workers AI real (HU-14)", () => {
  it("genera una propuesta sobre una prenda base con datos sintéticos", async () => {
    const result = await generateDesignProposal(
      {
        baseId: "camisetas-black",
        idea: "un tigre geométrico en tonos verdes, centrado en el pecho",
        size: "M",
      },
      { maxAttempts: 1 },
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect(result.proposal.image.provider).toBe("cloudflare-workers-ai");
    expect(["image/jpeg", "image/png", "image/webp"]).toContain(result.proposal.image.mimeType);
    expect(result.proposal.image.bytes.byteLength).toBeGreaterThan(10_000);
    expect(result.proposal.dataUrl.startsWith("data:image/")).toBe(true);
  }, 180_000);
});
