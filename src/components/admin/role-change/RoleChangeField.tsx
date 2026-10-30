import type { UIFieldServerComponent } from "payload";
import { hasAdminRole } from "@/access/roles";
import {
  getRoleChangeBlocker,
  isRoleCollection,
  ROLE_BY_COLLECTION,
  ROLE_LABELS,
  TARGET_COLLECTION,
} from "@/services/roles/change-role";
import { RoleChangeButton } from "./RoleChangeButton";

/** HU-05: shows the account's role and lets an administrator change it. */
export const RoleChangeField: UIFieldServerComponent = async ({
  collectionSlug,
  id,
  payload,
  req,
}) => {
  if (id === undefined || id === null || !isRoleCollection(collectionSlug)) {
    return null;
  }

  if (!hasAdminRole(req.user)) {
    return null;
  }

  const blocker = await getRoleChangeBlocker({ collection: collectionSlug, id, payload, req });
  const targetCollection = TARGET_COLLECTION[collectionSlug];

  return (
    <RoleChangeButton
      adminRoute={payload.config.routes.admin}
      apiRoute={payload.config.routes.api}
      blocker={blocker}
      collection={collectionSlug}
      currentRole={ROLE_LABELS[ROLE_BY_COLLECTION[collectionSlug]]}
      id={String(id)}
      targetRole={ROLE_LABELS[ROLE_BY_COLLECTION[targetCollection]]}
    />
  );
};
