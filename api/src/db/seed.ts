import { hash } from "argon2";
import type { SportType, UserRole } from "@db/db.generated.ts";
import { buildOpenHoursRange } from "@modules/bookings/bookings.policy.ts";
import { insertBooking, markBookingCancelled } from "@modules/bookings/bookings.repository.ts";
import { db } from "@shared/db.ts";

type DemoUser = {
  email: string;
  role: UserRole;
};

type DemoCourt = {
  name: string;
  sportType: SportType;
  hourlyPriceCents: number;
};

type DemoBooking = {
  playerEmail: string;
  courtName: string;
  dayOffset: number;
  startHour: number;
  durationHours: 1 | 2;
  isCancelled?: boolean;
};

type SeededIds = {
  userIds: Map<string, string>;
  courts: Map<string, { id: number; hourlyPriceCents: number }>;
};

const DEMO_PASSWORD = "courtly-demo";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = "2026-01-01".length;
const COURT_DATE_FORMAT = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" });

const PLAYER_EMAIL = "player@courtly.test";
const SECOND_PLAYER_EMAIL = "player2@courtly.test";

const DEMO_USERS: DemoUser[] = [
  { email: "admin@courtly.test", role: "admin" },
  { email: PLAYER_EMAIL, role: "player" },
  { email: SECOND_PLAYER_EMAIL, role: "player" },
];

const DEMO_COURTS: DemoCourt[] = [
  { name: "Center Court", sportType: "tennis", hourlyPriceCents: 3500 },
  { name: "Riverside Court", sportType: "tennis", hourlyPriceCents: 2500 },
  { name: "Padel Arena", sportType: "padel", hourlyPriceCents: 3000 },
  { name: "Shuttle Hall", sportType: "badminton", hourlyPriceCents: 1800 },
  { name: "Glass Box", sportType: "squash", hourlyPriceCents: 2000 },
];

const DEMO_BOOKINGS: DemoBooking[] = [
  { playerEmail: SECOND_PLAYER_EMAIL, courtName: "Glass Box", dayOffset: -3, startHour: 10, durationHours: 2 },
  { playerEmail: PLAYER_EMAIL, courtName: "Center Court", dayOffset: -1, startHour: 18, durationHours: 1 },
  { playerEmail: PLAYER_EMAIL, courtName: "Padel Arena", dayOffset: -1, startHour: 19, durationHours: 2 },
  { playerEmail: PLAYER_EMAIL, courtName: "Center Court", dayOffset: 0, startHour: 20, durationHours: 2 },
  { playerEmail: SECOND_PLAYER_EMAIL, courtName: "Riverside Court", dayOffset: 0, startHour: 19, durationHours: 1 },
  { playerEmail: SECOND_PLAYER_EMAIL, courtName: "Padel Arena", dayOffset: 0, startHour: 21, durationHours: 2 },
  { playerEmail: PLAYER_EMAIL, courtName: "Shuttle Hall", dayOffset: 1, startHour: 9, durationHours: 1 },
  { playerEmail: SECOND_PLAYER_EMAIL, courtName: "Center Court", dayOffset: 1, startHour: 10, durationHours: 2 },
  { playerEmail: PLAYER_EMAIL, courtName: "Padel Arena", dayOffset: 1, startHour: 18, durationHours: 2 },
  {
    playerEmail: SECOND_PLAYER_EMAIL,
    courtName: "Riverside Court",
    dayOffset: 1,
    startHour: 17,
    durationHours: 1,
    isCancelled: true,
  },
  { playerEmail: PLAYER_EMAIL, courtName: "Glass Box", dayOffset: 2, startHour: 18, durationHours: 2 },
  { playerEmail: SECOND_PLAYER_EMAIL, courtName: "Padel Arena", dayOffset: 3, startHour: 8, durationHours: 1 },
];

try {
  await seedDemoUsers();
  await seedDemoCourts();
  await seedDemoBookings();
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

async function seedDemoBookings() {
  if (!(await checkIsTableEmpty("bookings"))) return;

  const seededIds = await readSeededIds();

  for (const demoBooking of DEMO_BOOKINGS) {
    await insertDemoBooking(demoBooking, seededIds);
  }
}

async function insertDemoBooking(demoBooking: DemoBooking, { userIds, courts }: SeededIds) {
  const userId = userIds.get(demoBooking.playerEmail);
  const court = courts.get(demoBooking.courtName);

  if (userId === undefined || court === undefined) return;

  const booking = await insertBooking({
    userId,
    courtId: court.id,
    slot: buildDemoSlot(demoBooking),
    priceCents: court.hourlyPriceCents * demoBooking.durationHours,
  });

  if (booking === undefined || demoBooking.isCancelled !== true) return;

  await markBookingCancelled(booking.id, new Date());
}

async function readSeededIds(): Promise<SeededIds> {
  const [users, courts] = await Promise.all([
    db.selectFrom("users").select(["id", "email"]).execute(),
    db.selectFrom("courts").select(["id", "name", "hourlyPriceCents"]).execute(),
  ]);

  return {
    userIds: new Map(users.map((user) => [user.email, user.id])),
    courts: new Map(courts.map(({ name, ...court }) => [name, court])),
  };
}

function buildDemoSlot({ dayOffset, startHour, durationHours }: DemoBooking) {
  return buildOpenHoursRange(readCourtDate(dayOffset), {
    opensAt: formatWholeHour(startHour),
    closesAt: formatWholeHour(startHour + durationHours),
  });
}

function readCourtDate(dayOffset: number) {
  const todayAsUtcMs = Date.parse(`${COURT_DATE_FORMAT.format(new Date())}T00:00:00Z`);
  const dateAsUtc = new Date(todayAsUtcMs + dayOffset * MS_PER_DAY);

  return dateAsUtc.toISOString().slice(0, ISO_DATE_LENGTH);
}

function formatWholeHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00:00`;
}

async function checkIsTableEmpty(table: "users" | "courts" | "bookings") {
  const firstRow = await db.selectFrom(table).select("id").limit(1).executeTakeFirst();
  return firstRow === undefined;
}

async function buildUserRow(demoUser: DemoUser) {
  return { ...demoUser, passwordHash: await hash(DEMO_PASSWORD) };
}
