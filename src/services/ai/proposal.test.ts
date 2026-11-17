import { describe, expect, it } from "vitest";
import { createMockAiProvider } from "./mock-provider";
import { generateDesignProposal } from "./proposal";
import { IDEA_MAX_LENGTH } from "./proposal-prompt";
import type { AiImageRequest } from "./types";

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const BASE_ID = "camisetas-black";

const readBaseImage = async () => JPEG_BYTES;

const createRecordingProvider = () => {
  const requests: AiImageRequest[] = [];
  const provider = {
    model: "fake-model",
    name: "fake",
    generateImage: async (request: AiImageRequest) => {
      requests.push(request);

      return {
        bytes: PNG_BYTES,
        mimeType: "image/png" as const,
        model: "fake-model",
        provider: "fake",
      };
    },
  };

  return { provider, requests };
};

describe("generateDesignProposal (HU-14)", () => {
  it("rechaza una idea vacía o con solo espacios", async () => {
    const { provider } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "   ", size: "M" },
      { provider, readBaseImage },
    );

    expect(result).toMatchObject({
      message: "Describe tu idea antes de generar la propuesta.",
      ok: false,
      reason: "invalid_idea",
    });
  });

  it("rechaza una idea que supera el guard técnico de longitud", async () => {
    const { provider } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "a".repeat(IDEA_MAX_LENGTH + 1), size: "M" },
      { provider, readBaseImage },
    );

    expect(result).toMatchObject({ ok: false, reason: "invalid_idea" });
  });

  it("rechaza una prenda que no está en el manifiesto", async () => {
    const { provider } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: "camisetas-verde", idea: "Un tigre", size: "M" },
      { provider, readBaseImage },
    );

    expect(result).toMatchObject({ ok: false, reason: "invalid_base" });
  });

  it("rechaza una talla fuera del catálogo", async () => {
    const { provider } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "Un tigre", size: "XXL" },
      { provider, readBaseImage },
    );

    expect(result).toMatchObject({ ok: false, reason: "invalid_size" });
  });

  it("no envía referencias del cliente al proveedor mientras C-17 esté abierta", async () => {
    const { provider, requests } = createRecordingProvider();
    const result = await generateDesignProposal(
      {
        baseId: BASE_ID,
        idea: "Un tigre",
        referenceImageBytes: PNG_BYTES,
        size: "M",
      },
      { provider, readBaseImage },
    );

    expect(result).toMatchObject({
      message:
        "Las imágenes de referencia no se envían a la IA mientras la política de datos esté pendiente.",
      ok: false,
      reason: "invalid_reference",
    });
    expect(requests).toHaveLength(0);
  });

  it("envía la idea y la prenda base al proveedor y devuelve la imagen", async () => {
    const { provider, requests } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "  un   tigre geométrico ", size: "M" },
      { provider, readBaseImage },
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Se esperaba una propuesta válida.");
    }

    expect(result.proposal.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(result.proposal.image.provider).toBe("fake");
    expect(requests).toHaveLength(1);
    expect(requests[0]?.prompt).toContain("un tigre geométrico");
    expect(requests[0]?.prompt).toContain("Camiseta negra");
    expect(requests[0]?.referenceImage?.bytes).toEqual(JPEG_BYTES);
  });

  it("reintenta un fallo transitorio del proveedor y termina bien", async () => {
    const provider = createMockAiProvider({ failTimes: 2 });
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "Un tigre", size: "M" },
      { maxAttempts: 3, provider, readBaseImage, retryDelaysMs: [0] },
    );

    expect(result.ok).toBe(true);
  });

  it("devuelve un mensaje seguro cuando la cuota se agota", async () => {
    const provider = createMockAiProvider({ failTimes: 5 });
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "Un tigre", size: "M" },
      { maxAttempts: 1, provider, readBaseImage, retryDelaysMs: [0] },
    );

    expect(result).toMatchObject({
      message: "No pudimos generar la propuesta. Inténtalo de nuevo.",
      ok: false,
      reason: "unavailable",
    });
  });

  it("informa cuando la prenda base no se puede leer", async () => {
    const { provider } = createRecordingProvider();
    const result = await generateDesignProposal(
      { baseId: BASE_ID, idea: "Un tigre", size: "M" },
      {
        provider,
        readBaseImage: async () => {
          throw new Error("ENOENT");
        },
      },
    );

    expect(result).toMatchObject({
      message: "No pudimos cargar la prenda seleccionada.",
      ok: false,
      reason: "unavailable",
    });
  });
});
