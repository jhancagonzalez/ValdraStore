import type { PayloadRequest } from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canAccessAdminPanel, hasAdminRole, isAdmin, isCustomer } from "./roles";

const adminSession = { collection: "admins", email: "admin@valdra.test", id: 1, role: "admin" };
const customerSession = {
  collection: "customers",
  email: "cliente@valdra.test",
  id: 7,
  role: "customer",
};

/** Builds the part of the request that the access functions read. */
const requestFor = (user: unknown, adminCount = 1): PayloadRequest =>
  ({
    payload: { count: vi.fn().mockResolvedValue({ totalDocs: adminCount }) },
    user,
  }) as unknown as PayloadRequest;

const callAccess = (access: unknown, user: unknown): unknown =>
  (access as (args: { req: PayloadRequest }) => unknown)({ req: requestFor(user) });

describe("HU-05 criterio 1 — roles cliente y administrador", () => {
  it("reconoce al administrador por su colección", () => {
    expect(hasAdminRole(adminSession)).toBe(true);
  });

  it("trata la cuenta de cliente como cliente", () => {
    expect(hasAdminRole(customerSession)).toBe(false);
    expect(callAccess(isCustomer, customerSession)).toBe(true);
  });
});

describe("HU-05 criterio 2 — un cliente es rechazado en funciones administrativas", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no da acceso administrativo a un cliente ni a un visitante", () => {
    expect(callAccess(isAdmin, customerSession)).toBe(false);
    expect(callAccess(isAdmin, null)).toBe(false);
    expect(callAccess(isAdmin, adminSession)).toBe(true);
  });

  it("ignora un rol de administrador guardado en una cuenta de cliente", () => {
    expect(hasAdminRole({ ...customerSession, role: "admin" })).toBe(false);
    expect(hasAdminRole({ ...customerSession, roles: ["admin"] })).toBe(false);
  });

  it("niega el panel a un cliente aunque el bootstrap local esté activo", async () => {
    vi.stubEnv("ALLOW_ADMIN_BOOTSTRAP", "true");
    vi.stubEnv("NODE_ENV", "development");

    await expect(canAccessAdminPanel({ req: requestFor(customerSession, 1) })).resolves.toBe(false);
  });

  it("niega el panel a un cliente con el bootstrap desactivado", async () => {
    vi.stubEnv("ALLOW_ADMIN_BOOTSTRAP", "false");

    await expect(canAccessAdminPanel({ req: requestFor(customerSession, 0) })).resolves.toBe(false);
    await expect(canAccessAdminPanel({ req: requestFor(adminSession) })).resolves.toBe(true);
  });
});
