import { afterEach, describe, expect, it, vi } from "vitest";
import { hasValidOrigin } from "./request-origin";

const createRequest = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { headers });

describe("hasValidOrigin (HU-17)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("acepta una petición del mismo origen", () => {
    expect(
      hasValidOrigin(
        createRequest("https://valdra.test/api/personalization/approve", {
          origin: "https://valdra.test",
          "sec-fetch-site": "same-origin",
        }),
      ),
    ).toBe(true);
  });

  it("acepta una petición sin cabecera Origin", () => {
    expect(hasValidOrigin(createRequest("https://valdra.test/api/personalization/approve"))).toBe(
      true,
    );
  });

  it("rechaza una petición de otro sitio", () => {
    expect(
      hasValidOrigin(
        createRequest("https://valdra.test/api/personalization/approve", {
          origin: "https://atacante.test",
        }),
      ),
    ).toBe(false);
  });

  it("rechaza una petición marcada como cross-site", () => {
    expect(
      hasValidOrigin(
        createRequest("https://valdra.test/api/personalization/approve", {
          origin: "https://valdra.test",
          "sec-fetch-site": "cross-site",
        }),
      ),
    ).toBe(false);
  });

  it("acepta el origen configurado del servidor", () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "https://www.valdra.test");

    expect(
      hasValidOrigin(
        createRequest("http://localhost:3000/api/personalization/approve", {
          origin: "https://www.valdra.test",
        }),
      ),
    ).toBe(true);
  });

  it("rechaza un Origin que no es una URL válida", () => {
    expect(
      hasValidOrigin(
        createRequest("https://valdra.test/api/personalization/approve", {
          origin: "no-es-una-url",
        }),
      ),
    ).toBe(false);
  });
});
