import type { CollectionConfig } from "payload";
import { describe, expect, it } from "vitest";
import { withRoleManagement } from "./role-management";

const collection = (slug: string): CollectionConfig => ({
  fields: [{ name: "email", type: "email" }],
  slug,
});

describe("withRoleManagement (HU-05)", () => {
  it("agrega el endpoint y el control solo a administradores y clientes", () => {
    const [admins, customers, media] = withRoleManagement([
      collection("admins"),
      collection("customers"),
      collection("media"),
    ]);

    for (const roleCollection of [admins, customers]) {
      expect(roleCollection.endpoints).toEqual([
        expect.objectContaining({ method: "post", path: "/:id/change-role" }),
      ]);
      expect(roleCollection.fields.map((field) => ("name" in field ? field.name : null))).toContain(
        "roleChange",
      );
    }

    expect(media.endpoints).toBeUndefined();
    expect(media.fields).toHaveLength(1);
  });
});
