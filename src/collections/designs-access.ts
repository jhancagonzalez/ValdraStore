import type { Access, Where } from "payload";
import { hasAdminRole } from "../access/roles";

/** Solo los diseños activos son públicos (HU-23, criterio 3). */
export const ACTIVE_DESIGNS_WHERE: Where = { active: { equals: true } };

/** El administrador ve todos los diseños; el resto, solo los activos. */
export const readActiveDesigns: Access = ({ req }) =>
  hasAdminRole(req.user) ? true : ACTIVE_DESIGNS_WHERE;
