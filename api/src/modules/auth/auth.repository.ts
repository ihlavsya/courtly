import { sql } from "kysely";
import type { Insertable, Selectable } from "kysely";
import type { Sessions, Users } from "@db/db.generated.ts";
import { db } from "@shared/db.ts";

export type AuthenticatedUser = Pick<Selectable<Users>, "id" | "email" | "role">;

const AUTHENTICATED_USER_COLUMNS = ["users.id", "users.email", "users.role"] as const;

export function findUserWithPasswordHash(email: string) {
  return db
    .selectFrom("users")
    .select([...AUTHENTICATED_USER_COLUMNS, "users.passwordHash"])
    .where("users.email", "=", email)
    .executeTakeFirst();
}

export async function insertSession(session: Insertable<Sessions>) {
  await db.insertInto("sessions").values(session).execute();
}

export function findUserByActiveSessionId(sessionId: string): Promise<AuthenticatedUser | undefined> {
  return db
    .selectFrom("sessions")
    .innerJoin("users", "users.id", "sessions.userId")
    .select(AUTHENTICATED_USER_COLUMNS)
    .where("sessions.id", "=", sessionId)
    .where("sessions.expiresAt", ">", sql<Date>`now()`)
    .executeTakeFirst();
}
