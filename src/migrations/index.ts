import * as migration_20261023_165324 from "./20261023_165324";
import * as migration_20261023_174312 from "./20261023_174312";

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
];
