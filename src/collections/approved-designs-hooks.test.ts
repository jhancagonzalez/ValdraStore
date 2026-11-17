import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import {
  enforceApprovedDesignLimit,
  MAX_APPROVED_DESIGNS_PER_CUSTOMER,
} from "./approved-designs-hooks";

const customer = { collection: "customers", id: 7 };
const admin = { collection: "admins", id: 1 };

const createRequest = (totalDocs: number, user: unknown = customer): PayloadRequest => {
  const count = vi.fn().mockResolvedValue({ totalDocs });
  return { payload: { count }, user } as unknown as PayloadRequest;
};

const callHook = (
  req: PayloadRequest,
  operation: "create" | "update" = "create",
  data: Record<string, unknown> = {},
) =>
  enforceApprovedDesignLimit({
    data,
    operation,
    req,
  } as Parameters<typeof enforceApprovedDesignLimit>[0]);

describe("HU-17 — tope de diseños aprobados por cliente", () => {
  it("fija la propiedad desde la sesión y cuenta los diseños del cliente", async () => {
    const req = createRequest(0);

    await expect(callHook(req)).resolves.toMatchObject({ customer: 7 });
    expect(req.payload.count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "approved-designs",
        where: { customer: { equals: 7 } },
      }),
    );
  });

  it("rechaza con 429 al alcanzar el tope", async () => {
    const req = createRequest(MAX_APPROVED_DESIGNS_PER_CUSTOMER);

    await expect(callHook(req)).rejects.toMatchObject({ status: 429 });
  });

  it("permite el último diseño antes del tope", async () => {
    const req = createRequest(MAX_APPROVED_DESIGNS_PER_CUSTOMER - 1);

    await expect(callHook(req)).resolves.toMatchObject({ customer: 7 });
  });

  it("no cuenta ni reasigna la propiedad para un administrador", async () => {
    const req = createRequest(0, admin);

    await expect(callHook(req, "create", { customer: 99 })).resolves.toEqual({ customer: 99 });
    expect(req.payload.count).not.toHaveBeenCalled();
  });

  it("no aplica el tope al actualizar", async () => {
    const req = createRequest(MAX_APPROVED_DESIGNS_PER_CUSTOMER);

    await expect(callHook(req, "update")).resolves.toEqual({});
    expect(req.payload.count).not.toHaveBeenCalled();
  });
});
