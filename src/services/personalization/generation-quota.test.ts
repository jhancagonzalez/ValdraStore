import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";
import { consumeDailyGenerationQuota, DAILY_GENERATION_LIMIT } from "./generation-quota";

const payloadWith = (hits: number) => {
  const query = vi.fn().mockResolvedValue({ rows: [{ hits }] });
  const payload = { db: { pool: { query } } } as unknown as Payload;
  return { payload, query };
};

describe("cuota diaria de generaciones", () => {
  it("permite la primera generación y calcula las restantes", async () => {
    const { payload, query } = payloadWith(1);
    const now = new Date("2026-11-16T18:30:00.000Z");

    await expect(consumeDailyGenerationQuota(payload, 7, now)).resolves.toEqual({
      allowed: true,
      remaining: DAILY_GENERATION_LIMIT - 1,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("rate_limit_hits"), [
      "design-generation:7:daily",
      new Date("2026-11-16T00:00:00.000Z"),
    ]);
  });

  it("permite la última generación del día", async () => {
    const { payload } = payloadWith(DAILY_GENERATION_LIMIT);

    await expect(consumeDailyGenerationQuota(payload, 7)).resolves.toEqual({
      allowed: true,
      remaining: 0,
    });
  });

  it("bloquea cuando se supera el límite", async () => {
    const { payload } = payloadWith(DAILY_GENERATION_LIMIT + 1);

    await expect(consumeDailyGenerationQuota(payload, 7)).resolves.toEqual({ allowed: false });
  });

  it("usa una clave distinta por cliente", async () => {
    const { payload, query } = payloadWith(1);

    await consumeDailyGenerationQuota(payload, "customer-42", new Date("2026-11-16T23:59:00.000Z"));

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      "design-generation:customer-42:daily",
      new Date("2026-11-16T00:00:00.000Z"),
    ]);
  });
});
