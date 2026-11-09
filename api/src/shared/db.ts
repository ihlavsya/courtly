import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "@db/db.generated.ts";
import { env } from "@shared/env.ts";

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: env.DATABASE_URL }),
  }),
  plugins: [new CamelCasePlugin()],
});
