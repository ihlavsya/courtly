import { hash } from "argon2";
import type { UserRole } from "@db/db.generated.ts";
import { db } from "@shared/db.ts";

type DemoUser = {
  email: string;
  role: UserRole;
};

const DEMO_PASSWORD = "courtly-demo";

const DEMO_USERS: DemoUser[] = [
  { email: "admin@courtly.test", role: "admin" },
  { email: "player@courtly.test", role: "player" },
];

try {
  await seedDemoUsers();
} finally {
  await db.destroy();
}

async function seedDemoUsers() {
  const rows = await Promise.all(DEMO_USERS.map(buildUserRow));

  await db
    .insertInto("users")
    .values(rows)
    .onConflict((conflict) => conflict.column("email").doNothing())
    .execute();
}

async function buildUserRow(demoUser: DemoUser) {
  return { ...demoUser, passwordHash: await hash(DEMO_PASSWORD) };
}
