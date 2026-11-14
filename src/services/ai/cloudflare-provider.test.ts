import { describe, expect, it, vi } from "vitest";
import {
  CLOUDFLARE_DEFAULT_MODEL,
  CLOUDFLARE_PROVIDER_NAME,
  createCloudflareAiProvider,
} from "./cloudflare-provider";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const JSON_HEADERS = { "content-type": "application/json" };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: JSON_HEADERS, status });

const createProvider = (fetchImpl: typeof fetch) =>
  createCloudflareAiProvider({
    accountId: "cuenta-de-prueba",
    apiToken: "token-de-prueba",
    fetchImpl,
    timeoutMs: 1000,
  });

describe("createCloudflareAiProvider (HU-14)", () => {
  it("envía el prompt y decodifica la imagen Base64 del modelo", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ result: { image: PNG_BASE64 }, success: true }),
    ) as unknown as typeof fetch;

    const result = await createProvider(fetchImpl).generateImage({
      prompt: "Camiseta negra con un tigre geométrico.",
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.provider).toBe(CLOUDFLARE_PROVIDER_NAME);
    expect(result.model).toBe(CLOUDFLARE_DEFAULT_MODEL);
    expect(result.bytes.byteLength).toBeGreaterThan(0);

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/accounts/cuenta-de-prueba/ai/run/");
    expect(url).toContain(CLOUDFLARE_DEFAULT_MODEL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-de-prueba");

    const form = init.body as FormData;
    expect(form.get("prompt")).toBe("Camiseta negra con un tigre geométrico.");
  });

  it("acepta una imagen devuelta como data URL", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ result: { image: `data:image/png;base64,${PNG_BASE64}` }, success: true }),
    ) as unknown as typeof fetch;

    const result = await createProvider(fetchImpl).generateImage({ prompt: "Prueba" });

    expect(result.mimeType).toBe("image/png");
    expect(result.bytes.byteLength).toBeGreaterThan(0);
  });

  it("adjunta la imagen de referencia como input_image", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ result: { image: PNG_BASE64 }, success: true }),
    ) as unknown as typeof fetch;

    await createProvider(fetchImpl).generateImage({
      prompt: "Prueba",
      referenceImage: {
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
        mimeType: "image/jpeg",
      },
    });

    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const image = (init.body as FormData).get("input_image");

    expect(image).toBeInstanceOf(Blob);
    expect((image as File).size).toBe(4);
  });

  it("traduce el 429 en cuota agotada sin reintento", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ errors: [{ message: "quota" }], success: false }, 429),
    ) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "quota_exceeded", retryable: false });
  });

  it("marca los 5xx como transitorios", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ success: false }, 503),
    ) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "unavailable", retryable: true });
  });

  it("trata credenciales rechazadas como error de configuración", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ success: false }, 401),
    ) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "not_configured", retryable: false });
  });

  it("rechaza contenido moderado sin reintentar", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('{"success":false,"errors":[{"message":"flagged by moderation"}]}', {
          headers: JSON_HEADERS,
          status: 400,
        }),
    ) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "content_rejected", retryable: false });
  });

  it("falla con invalid_response si el cuerpo no trae una imagen válida", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ result: { image: "no-es-una-imagen" }, success: true }),
    ) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("no llama al proveedor si faltan credenciales", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const provider = createCloudflareAiProvider({
      accountId: "",
      apiToken: "",
      fetchImpl,
    });

    await expect(provider.generateImage({ prompt: "Prueba" })).rejects.toMatchObject({
      code: "not_configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("marca un fallo de red como transitorio", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    await expect(
      createProvider(fetchImpl).generateImage({ prompt: "Prueba" }),
    ).rejects.toMatchObject({ code: "unavailable", retryable: true });
  });

  it("marca el tiempo agotado como transitorio", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    ) as unknown as typeof fetch;

    const provider = createCloudflareAiProvider({
      accountId: "cuenta-de-prueba",
      apiToken: "token-de-prueba",
      fetchImpl,
      timeoutMs: 20,
    });

    await expect(provider.generateImage({ prompt: "Prueba" })).rejects.toMatchObject({
      code: "timeout",
      retryable: true,
    });
  });
});
