import type { CollectionConfig, Field } from "payload";
import { isRoleCollection } from "../services/roles/change-role";
import { changeRoleEndpoint } from "../services/roles/change-role-endpoint";

/** Sidebar control in the admin panel; the component only calls the endpoint. */
const roleChangeField: Field = {
  name: "roleChange",
  type: "ui",
  admin: {
    components: {
      Field: "@/components/admin/role-change/RoleChangeField#RoleChangeField",
    },
    position: "sidebar",
  },
};

/**
 * HU-05: adds the role-change endpoint and panel control to the `admins` and
 * `customers` collections without touching their own configuration files.
 */
export const withRoleManagement = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((collection) => {
    if (!isRoleCollection(collection.slug)) {
      return collection;
    }

    return {
      ...collection,
      endpoints: [...(collection.endpoints || []), changeRoleEndpoint(collection.slug)],
      fields: [...collection.fields, roleChangeField],
    };
  });
