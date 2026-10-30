import type { Payload, PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { changeAccountRole, getRoleChangeBlocker } from "./change-role";

const adminSession = { collection: "admins", email: "admin@valdra.test", id: 1, role: "admin" };
const customerSession = { collection: "customers", email: "ana@valdra.test", id: 7 };

type Accounts = {
  admins: Record<string, unknown>[];
  customers: Record<string, unknown>[];
};

/** In-memory stand-in for the Payload calls the service makes. */
const createFakePayload = (accounts: Accounts) => {
  let nextId = 100;
  const list = (collection: string) => accounts[collection as keyof Accounts];

  const payload = {
    count: vi.fn(async ({ collection, where }) => {
      const email = where?.email?.equals;
      const docs = list(collection).filter((doc) => !email || doc.email === email);
      return { totalDocs: docs.length };
    }),
    create: vi.fn(async ({ collection, data }) => {
      const doc = { ...data, hash: "temporary-hash", id: nextId++, salt: "temporary-salt" };
      delete doc.password;
      list(collection).push(doc);
      return doc;
    }),
    db: {
      findOne: vi.fn(async ({ collection, where }) => {
        const id = where?.id?.equals;
        return list(collection).find((doc) => String(doc.id) === String(id)) ?? null;
      }),
      updateOne: vi.fn(async ({ collection, data, id }) => {
        const doc = list(collection).find((item) => item.id === id);
        Object.assign(doc ?? {}, data);
        return doc;
      }),
    },
    delete: vi.fn(async ({ collection, id }) => {
      const docs = list(collection);
      const index = docs.findIndex((doc) => String(doc.id) === String(id));
      return docs.splice(index, 1)[0];
    }),
  };

  return payload as typeof payload & Payload;
};

const requestAs = (user: unknown) => ({ user }) as unknown as PayloadRequest;

const seed = (): Accounts => ({
  admins: [
    { email: "admin@valdra.test", hash: "admin-hash", id: 1, role: "admin", salt: "admin-salt" },
    { email: "otro@valdra.test", hash: "otro-hash", id: 2, role: "admin", salt: "otro-salt" },
  ],
  customers: [
    {
      email: "ana@valdra.test",
      hash: "ana-hash",
      id: 7,
      name: "Ana",
      role: "customer",
      salt: "ana-salt",
    },
  ],
});

describe("HU-05 criterio 3 — el administrador cambia el rol de un usuario", () => {
  it("convierte un cliente en administrador conservando correo y contraseña", async () => {
    const accounts = seed();
    const payload = createFakePayload(accounts);

    const result = await changeAccountRole({
      collection: "customers",
      id: 7,
      payload,
      req: requestAs(adminSession),
    });

    expect(result).toMatchObject({ collection: "admins", role: "admin" });
    const promoted = accounts.admins.find((doc) => doc.id === result.id);
    expect(promoted).toMatchObject({
      email: "ana@valdra.test",
      hash: "ana-hash",
      salt: "ana-salt",
    });
    expect(accounts.customers).toHaveLength(0);
  });

  it("convierte un administrador en cliente y le asigna un nombre", async () => {
    const accounts = seed();
    const payload = createFakePayload(accounts);

    const result = await changeAccountRole({
      collection: "admins",
      id: 2,
      payload,
      req: requestAs(adminSession),
    });

    expect(result).toMatchObject({ collection: "customers", role: "customer" });
    const demoted = accounts.customers.find((doc) => doc.id === result.id);
    expect(demoted).toMatchObject({
      email: "otro@valdra.test",
      hash: "otro-hash",
      name: "otro",
      salt: "otro-salt",
    });
    expect(accounts.admins.map((doc) => doc.id)).toEqual([1]);
  });

  it("borra la cuenta original para cerrar las sesiones del rol anterior", async () => {
    const payload = createFakePayload(seed());

    await changeAccountRole({
      collection: "customers",
      id: 7,
      payload,
      req: requestAs(adminSession),
    });

    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "customers", id: 7 }),
    );
  });

  it("rechaza a un cliente que intenta cambiar roles", async () => {
    const payload = createFakePayload(seed());

    await expect(
      changeAccountRole({
        collection: "customers",
        id: 7,
        payload,
        req: requestAs(customerSession),
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("rechaza la petición sin sesión", async () => {
    const payload = createFakePayload(seed());

    await expect(
      changeAccountRole({ collection: "customers", id: 7, payload, req: requestAs(null) }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("impide que un administrador cambie su propio rol", async () => {
    const payload = createFakePayload(seed());

    await expect(
      changeAccountRole({ collection: "admins", id: 1, payload, req: requestAs(adminSession) }),
    ).rejects.toMatchObject({ status: 409 });
    expect(payload.delete).not.toHaveBeenCalled();
  });

  it("conserva al último administrador", async () => {
    const accounts = seed();
    accounts.admins = accounts.admins.slice(1);
    const payload = createFakePayload(accounts);

    const blocker = await getRoleChangeBlocker({
      collection: "admins",
      id: 2,
      payload,
      req: requestAs(adminSession),
    });

    expect(blocker).toMatch(/al menos un administrador/);
  });

  it("no duplica un correo que ya existe en el rol destino", async () => {
    const accounts = seed();
    accounts.admins.push({ email: "ana@valdra.test", hash: "h", id: 3, salt: "s" });
    const payload = createFakePayload(accounts);

    await expect(
      changeAccountRole({ collection: "customers", id: 7, payload, req: requestAs(adminSession) }),
    ).rejects.toMatchObject({ status: 409 });
    expect(accounts.customers).toHaveLength(1);
  });

  it("responde 404 si la cuenta no existe", async () => {
    const payload = createFakePayload(seed());

    await expect(
      changeAccountRole({ collection: "customers", id: 99, payload, req: requestAs(adminSession) }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
