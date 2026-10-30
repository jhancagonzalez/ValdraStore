import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { changeRoleHandler } from "./change-role-endpoint";

const adminSession = { collection: "admins", id: 1, role: "admin" };
const customerSession = { collection: "customers", id: 7, role: "customer" };

const createRequest = (user: unknown, id: unknown, failCreate = false) => {
  const db = {
    beginTransaction: vi.fn().mockResolvedValue("tx-1"),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    findOne: vi.fn().mockResolvedValue({
      email: "ana@valdra.test",
      hash: "ana-hash",
      id: 7,
      name: "Ana",
      salt: "ana-salt",
    }),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    updateOne: vi.fn().mockResolvedValue({}),
  };
  const payload = {
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    create: failCreate
      ? vi.fn().mockRejectedValue(new Error("db down"))
      : vi.fn().mockResolvedValue({ id: 101 }),
    db,
    delete: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn() },
  };
  const req = { payload, routeParams: { id }, user } as unknown as PayloadRequest;

  return { db, payload, req };
};

describe("POST /api/customers/:id/change-role (HU-05)", () => {
  it("responde 401 sin sesión", async () => {
    const { req } = createRequest(null, "7");
    const response = await changeRoleHandler("customers")(req);

    expect(response.status).toBe(401);
  });

  it("responde 403 a un cliente (criterio 2)", async () => {
    const { db, req } = createRequest(customerSession, "7");
    const response = await changeRoleHandler("customers")(req);

    expect(response.status).toBe(403);
    expect(db.beginTransaction).not.toHaveBeenCalled();
  });

  it("valida el identificador", async () => {
    const { req } = createRequest(adminSession, "");
    const response = await changeRoleHandler("customers")(req);

    expect(response.status).toBe(400);
  });

  it("cambia el rol dentro de una transacción y devuelve la nueva cuenta", async () => {
    const { db, payload, req } = createRequest(adminSession, "7");
    const response = await changeRoleHandler("customers")(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ collection: "admins", id: 101, role: "admin" });
    expect(db.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { equals: 7 } } }),
    );
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "customers", id: 7 }),
    );
    expect(db.commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(db.rollbackTransaction).not.toHaveBeenCalled();
  });

  it("revierte la transacción si algo falla", async () => {
    const { db, payload, req } = createRequest(adminSession, "7", true);
    const response = await changeRoleHandler("customers")(req);

    expect(response.status).toBe(500);
    expect(db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(db.commitTransaction).not.toHaveBeenCalled();
    expect(payload.delete).not.toHaveBeenCalled();
  });
});
