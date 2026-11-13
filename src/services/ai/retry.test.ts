import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "./errors";
import { retryAsync } from "./retry";

const noSleep = () => Promise.resolve();

describe("retryAsync (HU-14)", () => {
  it("reintenta un error transitorio y devuelve el resultado", async () => {
    let attempts = 0;

    const result = await retryAsync(
      async (attempt) => {
        attempts = attempt;

        if (attempt < 3) {
          throw new AiProviderError("unavailable", "Fallo temporal del proveedor.");
        }

        return "propuesta";
      },
      { sleep: noSleep },
    );

    expect(result).toBe("propuesta");
    expect(attempts).toBe(3);
  });

  it("no reintenta un error de cuota agotada", async () => {
    const operation = vi.fn(async () => {
      throw new AiProviderError("quota_exceeded", "Sin cuota.");
    });

    await expect(retryAsync(operation, { sleep: noSleep })).rejects.toMatchObject({
      code: "quota_exceeded",
    });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("respeta el máximo de intentos configurado", async () => {
    const operation = vi.fn(async () => {
      throw new AiProviderError("timeout", "Demasiado lento.");
    });

    await expect(retryAsync(operation, { maxAttempts: 2, sleep: noSleep })).rejects.toMatchObject({
      code: "timeout",
    });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("no reintenta errores desconocidos para no ocultar fallos de código", async () => {
    const operation = vi.fn(async () => {
      throw new Error("fallo inesperado");
    });

    await expect(retryAsync(operation, { sleep: noSleep })).rejects.toThrow("fallo inesperado");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("no ejecuta nada si la petición ya fue cancelada", async () => {
    const controller = new AbortController();
    controller.abort();
    const operation = vi.fn(async () => "propuesta");

    await expect(
      retryAsync(operation, { signal: controller.signal, sleep: noSleep }),
    ).rejects.toMatchObject({ code: "timeout", retryable: false });
    expect(operation).not.toHaveBeenCalled();
  });

  it("informa la espera antes de cada reintento", async () => {
    const onRetry = vi.fn();
    let attempts = 0;

    await retryAsync(
      async () => {
        attempts += 1;

        if (attempts === 1) {
          throw new AiProviderError("unavailable", "Fallo temporal.");
        }

        return "propuesta";
      },
      { delaysMs: [10], onRetry, sleep: noSleep },
    );

    expect(onRetry).toHaveBeenCalledWith({
      attempt: 1,
      error: expect.any(AiProviderError),
      nextDelayMs: 10,
    });
  });
});
