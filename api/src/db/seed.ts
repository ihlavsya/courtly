import { hash } from "argon2";
import type { SportType, UserRole } from "@db/db.generated.ts";
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

type DemoCourt = {
  name: string;
  sportType: SportType;
  hourlyPriceCents: number;
};

const DEMO_COURTS: DemoCourt[] = [
  { name: "Center Court", sportType: "tennis", hourlyPriceCents: 3500 },
  { name: "Riverside Court", sportType: "tennis", hourlyPriceCents: 2500 },
  { name: "Shuttle Hall", sportType: "badminton", hourlyPriceCents: 1800 },
  { name: "Glass Box", sportType: "squash", hourlyPriceCents: 2000 },
];

try {
  await seedDemoUsers();
  await seedDemoCourts();
} finally {
  await db.destroy();
}

async function seedDemoUsers() {
  if (!(await checkIsTableEmpty("users"))) return;

  const rows = await Promise.all(DEMO_USERS.map(buildUserRow));
  await db.insertInto("users").values(rows).execute();
}

async function seedDemoCourts() {
  if (!(await checkIsTableEmpty("courts"))) return;

  await db.insertInto("courts").values(DEMO_COURTS).execute();
}

async function checkIsTableEmpty(table: "users" | "courts") {
  const firstRow = await db.selectFrom(table).select("id").limit(1).executeTakeFirst();
  return firstRow === undefined;
}

async function buildUserRow(demoUser: DemoUser) {
  return { ...demoUser, passwordHash: await hash(DEMO_PASSWORD) };
}
