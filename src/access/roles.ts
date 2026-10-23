import type { Access, FieldAccess, PayloadRequest } from "payload";

type RoleBearingUser = {
  role?: unknown;
  roles?: unknown;
};

export const hasAdminRole = (user: unknown): user is RoleBearingUser => {
  if (!user || typeof user !== "object") {
    return false;
  }

  const roleBearingUser = user as RoleBearingUser;

  return (
    roleBearingUser.role === "admin" ||
    (Array.isArray(roleBearingUser.roles) && roleBearingUser.roles.includes("admin"))
  );
};

export const isAdmin: Access = ({ req }) => hasAdminRole(req.user);
export const isAdminField: FieldAccess = ({ req }) => hasAdminRole(req.user);
export const isCustomer: FieldAccess = ({ req }) => Boolean(req.user) && !hasAdminRole(req.user);

/**
 * Allow initial administrator setup only in a local, non-production
 * environment and only while the administrator collection is empty.
 */
export const canAccessAdminPanel = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  if (hasAdminRole(req.user)) {
    return true;
  }

  if (process.env.NODE_ENV === "production" || process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
    return false;
  }

  const { totalDocs } = await req.payload.count({
    collection: "admins",
    overrideAccess: true,
  });

  return totalDocs === 0;
};

export const isAdminOrLocalBootstrap: Access = canAccessAdminPanel;
export const isAdminOrLocalBootstrapField: FieldAccess = async ({ req }) =>
  canAccessAdminPanel({ req });
