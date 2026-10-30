import { randomBytes } from "node:crypto";
import { APIError, type Payload, type PayloadRequest } from "payload";
import { hasAdminRole } from "../../access/roles";

/**
 * HU-05: the role of an account is the auth collection that holds it. Changing a
 * role moves the account to the other collection, keeping its email and password,
 * and deletes the original document. Deleting it ends every session of the old
 * role, so the new role applies from the account's next sign-in.
 */
export type RoleCollection = "admins" | "customers";
export type AccountRole = "admin" | "customer";

export const ROLE_BY_COLLECTION: Record<RoleCollection, AccountRole> = {
  admins: "admin",
  customers: "customer",
};

export const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "Administrador",
  customer: "Cliente",
};

export const TARGET_COLLECTION: Record<RoleCollection, RoleCollection> = {
  admins: "customers",
  customers: "admins",
};

export const isRoleCollection = (value: unknown): value is RoleCollection =>
  value === "admins" || value === "customers";

export type ChangeRoleArgs = {
  collection: RoleCollection;
  id: number | string;
  payload: Payload;
  req: PayloadRequest;
};

export type ChangeRoleResult = {
  collection: RoleCollection;
  id: number | string;
  role: AccountRole;
};

/** Raw stored account, read through the database adapter to keep the password hash. */
type StoredAccount = {
  email?: unknown;
  hash?: unknown;
  id: number | string;
  name?: unknown;
  salt?: unknown;
};

const sameId = (left: unknown, right: unknown): boolean =>
  left !== undefined && left !== null && String(left) === String(right);

/** Customers require a name; an administrator has none, so use the email's local part. */
const customerNameFor = (account: { email: string; name?: unknown }): string => {
  if (typeof account.name === "string" && account.name.trim()) {
    return account.name.trim();
  }

  return account.email.split("@")[0] || account.email;
};

/**
 * Returns why the account's role cannot change, or null when it can. An
 * administrator cannot demote themselves, and the last administrator always stays.
 */
export const getRoleChangeBlocker = async ({
  collection,
  id,
  payload,
  req,
}: ChangeRoleArgs): Promise<string | null> => {
  if (collection !== "admins") {
    return null;
  }

  if (req.user?.collection === "admins" && sameId(req.user.id, id)) {
    return "No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.";
  }

  const { totalDocs } = await payload.count({ collection: "admins", overrideAccess: true, req });

  if (totalDocs <= 1) {
    return "Debe quedar al menos un administrador en el sistema.";
  }

  return null;
};

export const changeAccountRole = async (args: ChangeRoleArgs): Promise<ChangeRoleResult> => {
  const { collection, id, payload, req } = args;

  if (!req.user) {
    throw new APIError("Inicia sesión como administrador para cambiar roles.", 401);
  }

  if (!hasAdminRole(req.user)) {
    throw new APIError("Solo un administrador puede cambiar el rol de una cuenta.", 403);
  }

  const blocker = await getRoleChangeBlocker(args);

  if (blocker) {
    throw new APIError(blocker, 409);
  }

  const source = await payload.db.findOne<StoredAccount>({
    collection,
    req,
    where: { id: { equals: id } },
  });

  if (!source) {
    throw new APIError("La cuenta no existe.", 404);
  }

  const { email, hash, salt } = source;

  if (typeof email !== "string" || typeof hash !== "string" || typeof salt !== "string") {
    throw new APIError("La cuenta no tiene una contraseña que se pueda conservar.", 409);
  }

  const target = TARGET_COLLECTION[collection];
  const { totalDocs: existing } = await payload.count({
    collection: target,
    overrideAccess: true,
    req,
    where: { email: { equals: email } },
  });

  if (existing > 0) {
    throw new APIError(
      `Ya existe una cuenta de ${ROLE_LABELS[ROLE_BY_COLLECTION[target]].toLowerCase()} con ese correo.`,
      409,
    );
  }

  // Payload requires a password to create an auth document; it is replaced below
  // with the original hash, so the user keeps the password they already know.
  const temporaryPassword = randomBytes(32).toString("hex");

  // The collection hooks still assign the role on the server.
  const created =
    target === "customers"
      ? await payload.create({
          collection: "customers",
          data: {
            email,
            name: customerNameFor({ email, name: source.name }),
            password: temporaryPassword,
          },
          overrideAccess: true,
          req,
        })
      : await payload.create({
          collection: "admins",
          data: { email, password: temporaryPassword },
          overrideAccess: true,
          req,
        });

  await payload.db.updateOne({
    collection: target,
    data: { hash, salt },
    id: created.id,
    req,
    returning: false,
  });

  await payload.delete({ collection, id: source.id, overrideAccess: true, req });

  return { collection: target, id: created.id, role: ROLE_BY_COLLECTION[target] };
};
