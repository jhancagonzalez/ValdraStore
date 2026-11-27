import type { Field, JoinField } from "payload";
import { describe, expect, it } from "vitest";
import { Customers } from "./Customers";
import { GarmentStock } from "./GarmentStock";
import { Orders } from "./Orders";

const fieldByName = (fields: Field[], name: string): Field | undefined =>
  fields.find((field) => "name" in field && field.name === name);

describe("panel de clientes y pedidos (HU-24)", () => {
  it("la lista de pedidos muestra los datos principales del pedido", () => {
    expect(Orders.admin?.defaultColumns).toEqual([
      "orderNumber",
      "customer",
      "status",
      "quantity",
      "total",
      "createdAt",
    ]);
    expect(Orders.admin?.useAsTitle).toBe("orderNumber");
    expect(Orders.admin?.group).toBe("Pedidos");
  });

  it("ordena los pedidos del más reciente al más antiguo", () => {
    expect(Orders.defaultSort).toBe("-createdAt");
  });

  it("permite buscar pedidos por número y por prenda", () => {
    expect(Orders.admin?.listSearchableFields).toEqual(
      expect.arrayContaining(["orderNumber", "garmentLabel", "size"]),
    );
  });

  it("la lista de clientes muestra sus datos principales y permite buscarlos", () => {
    expect(Customers.admin?.defaultColumns).toEqual([
      "name",
      "lastName",
      "email",
      "phone",
      "createdAt",
    ]);
    expect(Customers.admin?.listSearchableFields).toEqual(
      expect.arrayContaining(["name", "lastName", "email", "phone"]),
    );
  });

  it("el detalle del cliente lista sus pedidos con número, estado y total", () => {
    const join = fieldByName(Customers.fields, "orders") as JoinField | undefined;

    expect(join?.type).toBe("join");
    expect(join?.collection).toBe("orders");
    expect(join?.on).toBe("customer");
    expect(join?.admin?.defaultColumns).toEqual([
      "orderNumber",
      "status",
      "quantity",
      "total",
      "createdAt",
    ]);
  });

  it("solo el administrador puede leer los pedidos desde la cuenta del cliente", () => {
    const join = fieldByName(Customers.fields, "orders") as JoinField | undefined;
    const read = join?.access?.read;

    expect(typeof read).toBe("function");

    const canRead = read as (args: { req: { user: unknown } }) => unknown;

    expect(canRead({ req: { user: { collection: "customers", id: 7, role: "customer" } } })).toBe(
      false,
    );
    expect(canRead({ req: { user: { collection: "admins", id: 1, role: "admin" } } })).toBe(true);
    expect(canRead({ req: { user: null } })).toBe(false);
  });

  it("los campos del pedido tienen etiquetas en español", () => {
    const expected = [
      "orderNumber",
      "customer",
      "design",
      "quantity",
      "garmentBase",
      "garmentLabel",
      "category",
      "colorLabel",
      "size",
      "unitPrice",
      "total",
      "status",
      "source",
      "createdBy",
    ];

    for (const name of expected) {
      const field = fieldByName(Orders.fields, name);

      expect(field, name).toBeDefined();
      expect(field && "label" in field ? field.label : undefined, name).toBeTruthy();
    }
  });

  it("el inventario muestra sus columnas con etiquetas en español", () => {
    for (const name of ["baseId", "size", "quantity", "active"]) {
      const field = fieldByName(GarmentStock.fields, name);

      expect(field, name).toBeDefined();
      expect(field && "label" in field ? field.label : undefined, name).toBeTruthy();
    }
  });
});
