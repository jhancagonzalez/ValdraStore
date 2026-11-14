import { describe, expect, it, vi } from "vitest";
import { moderateDesignRequest, parseModerationOutput } from "./moderation";

const credentials = { accountId: "account", apiToken: "token" };

const providerReturning = (response: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    json: async () => ({ result: { response } }),
    ok,
  }) as unknown as typeof fetch;

describe("parseModerationOutput", () => {
  it("lee la salida de texto de Llama Guard", () => {
    expect(parseModerationOutput("safe")).toEqual({ safe: true, categories: [] });
    expect(parseModerationOutput("unsafe\nS1,S10")).toEqual({
      safe: false,
      categories: ["S1", "S10"],
    });
  });

  it("lee la salida como objeto", () => {
    expect(parseModerationOutput({ safe: false, categories: ["S12: Sexual Content"] })).toEqual({
      safe: false,
      categories: ["S12"],
    });
  });

  it("devuelve null ante una salida desconocida", () => {
    expect(parseModerationOutput("tal vez")).toBeNull();
    expect(parseModerationOutput({ safe: "no" })).toBeNull();
    expect(parseModerationOutput(undefined)).toBeNull();
  });
});

describe("moderateDesignRequest", () => {
  it("permite un diseño que el moderador marca como seguro", async () => {
    const result = await moderateDesignRequest("un colibrí con flores", {
      ...credentials,
      fetchImpl: providerReturning("safe"),
    });

    expect(result).toEqual({ allowed: true, checked: true, categories: [] });
  });

  it("bloquea las categorías de riesgo y explica el motivo", async () => {
    const result = await moderateDesignRequest("…", {
      ...credentials,
      fetchImpl: providerReturning("unsafe\nS10"),
    });

    expect(result).toMatchObject({ allowed: false, checked: true, categories: ["S10"] });
    expect(result.message).toMatch(/normas de contenido/);
  });

  it("explica los derechos de terceros cuando la categoría es S8", async () => {
    const result = await moderateDesignRequest("…", {
      ...credentials,
      fetchImpl: providerReturning("unsafe\nS8"),
    });

    expect(result.message).toMatch(/derechos de terceros/);
  });

  it("no bloquea categorías ajenas al estampado, como asesoría especializada (S6)", async () => {
    const result = await moderateDesignRequest("…", {
      ...credentials,
      fetchImpl: providerReturning("unsafe\nS6"),
    });

    expect(result.allowed).toBe(true);
  });

  it("continúa sin verificar si el moderador falla o no hay credenciales", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("timeout")) as unknown as typeof fetch;

    await expect(
      moderateDesignRequest("…", { ...credentials, fetchImpl: failing }),
    ).resolves.toMatchObject({ allowed: true, checked: false });
    await expect(
      moderateDesignRequest("…", { ...credentials, fetchImpl: providerReturning(null, false) }),
    ).resolves.toMatchObject({ allowed: true, checked: false });
    await expect(
      moderateDesignRequest("…", { accountId: "", apiToken: "", fetchImpl: failing }),
    ).resolves.toMatchObject({ allowed: true, checked: false });
    expect(failing).toHaveBeenCalledTimes(1);
  });
});
