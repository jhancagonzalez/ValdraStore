import * as migration_20261023_165324 from "./20261023_165324";
import * as migration_20261023_174312 from "./20261023_174312";
import * as migration_20261023_185244_sprint1_customers_media_product_fields from "./20261023_185244_sprint1_customers_media_product_fields";
import * as migration_20261026_224713_customer_phone from "./20261026_224713_customer_phone";
import * as migration_20261027_041746_sprint1_product_gallery from "./20261027_041746_sprint1_product_gallery";
import * as migration_20261030_120000_media_rls from "./20261030_120000_media_rls";
import * as migration_20261030_130000_last_admin_guard from "./20261030_130000_last_admin_guard";
import * as migration_20261030_131000_rate_limit from "./20261030_131000_rate_limit";
import * as migration_20261030_140000_customer_last_name from "./20261030_140000_customer_last_name";

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
  {
    up: migration_20261026_224713_customer_phone.up,
    down: migration_20261026_224713_customer_phone.down,
    name: "20261026_224713_customer_phone",
  },
  {
    up: migration_20261027_041746_sprint1_product_gallery.up,
    down: migration_20261027_041746_sprint1_product_gallery.down,
    name: "20261027_041746_sprint1_product_gallery",
  },
  {
    up: migration_20261030_120000_media_rls.up,
    down: migration_20261030_120000_media_rls.down,
    name: "20261030_120000_media_rls",
  },
  {
    up: migration_20261030_130000_last_admin_guard.up,
    down: migration_20261030_130000_last_admin_guard.down,
    name: "20261030_130000_last_admin_guard",
  },
  {
    up: migration_20261030_131000_rate_limit.up,
    down: migration_20261030_131000_rate_limit.down,
    name: "20261030_131000_rate_limit",
  },
  {
    up: migration_20261030_140000_customer_last_name.up,
    down: migration_20261030_140000_customer_last_name.down,
    name: "20261030_140000_customer_last_name",
  },
];
