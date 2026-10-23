import * as migration_20261023_165324 from "./20261023_165324";
import * as migration_20261023_174312 from "./20261023_174312";
import * as migration_20261023_185244_sprint1_customers_media_product_fields from "./20261023_185244_sprint1_customers_media_product_fields";

export const migrations = [
  {
    up: migration_20261023_165324.up,
    down: migration_20261023_165324.down,
    name: "20261023_165324",
  },
  {
    up: migration_20261023_174312.up,
    down: migration_20261023_174312.down,
    name: "20261023_174312",
  },
  {
    up: migration_20261023_185244_sprint1_customers_media_product_fields.up,
    down: migration_20261023_185244_sprint1_customers_media_product_fields.down,
    name: "20261023_185244_sprint1_customers_media_product_fields",
  },
];
