import {
  APIError,
  commitTransaction,
  type Endpoint,
  initTransaction,
  killTransaction,
  type PayloadHandler,
} from "payload";
import { hasAdminRole } from "../../access/roles";
import { changeAccountRole, ROLE_LABELS, type RoleCollection } from "./change-role";

const json = (body: Record<string, unknown>, status: number): Response =>
  Response.json(body, { status });

/** Postgres ids are numeric; route params arrive as strings. */
const parseId = (value: unknown): number | string | null => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return /^\d+$/.test(value) ? Number(value) : value;
};

/**
 * POST /api/{collection}/:id/change-role (HU-05). Only an administrator may call it;
 * the move runs in one transaction so a failure leaves the account untouched.
 */
export const changeRoleHandler =
  (collection: RoleCollection): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      return json({ message: "Inicia sesión como administrador para cambiar roles." }, 401);
    }

    if (!hasAdminRole(req.user)) {
      return json({ message: "Solo un administrador puede cambiar el rol de una cuenta." }, 403);
    }

    const id = parseId(req.routeParams?.id);

    if (id === null) {
      return json({ message: "Falta el identificador de la cuenta." }, 400);
    }

    const shouldCommit = await initTransaction(req);

    try {
      const result = await changeAccountRole({ collection, id, payload: req.payload, req });

      if (shouldCommit) {
        await commitTransaction(req);
      }

      return json(
        {
          ...result,
          message: `Rol cambiado a ${ROLE_LABELS[result.role]}. Se aplica en el siguiente inicio de sesión.`,
        },
        200,
      );
    } catch (error) {
      if (shouldCommit) {
        await killTransaction(req);
      }

      if (error instanceof APIError) {
        return json({ message: error.message }, error.status);
      }

      req.payload.logger.error({ err: error, msg: "HU-05: no se pudo cambiar el rol" });

      return json({ message: "No se pudo cambiar el rol. Intenta de nuevo." }, 500);
    }
  };

export const changeRoleEndpoint = (collection: RoleCollection): Endpoint => ({
  handler: changeRoleHandler(collection),
  method: "post",
  path: "/:id/change-role",
});
