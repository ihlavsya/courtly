import pg from "pg";
import type { CourtDetails, NewCourt } from "@modules/courts/courts.schema.ts";
import { db } from "@shared/db.ts";

const UNIQUE_VIOLATION_CODE = "23505";
const COURT_NAME_UNIQUE_INDEX = "courts_name_unique";

const ADMIN_COURT_COLUMNS = [
  "courts.id",
  "courts.name",
  "courts.sportType",
  "courts.hourlyPriceCents",
  "courts.isActive",
] as const;

export function listActiveCourts() {
  return db
    .selectFrom("courts")
    .select([
      "courts.id",
      "courts.name",
      "courts.sportType",
      "courts.hourlyPriceCents",
      "courts.opensAt",
      "courts.closesAt",
    ])
    .where("courts.isActive", "=", true)
    .orderBy("courts.name")
    .execute();
}

export function listCourts() {
  return db
    .selectFrom("courts")
    .select(["courts.id", "courts.name", "courts.sportType", "courts.isActive"])
    .orderBy("courts.name")
    .execute();
}

export function listAdminCourts() {
  return db.selectFrom("courts").select(ADMIN_COURT_COLUMNS).orderBy("courts.name").execute();
}

export function findAdminCourt(courtId: number) {
  return db.selectFrom("courts").select(ADMIN_COURT_COLUMNS).where("courts.id", "=", courtId).executeTakeFirst();
}

export function findActiveCourt(courtId: number) {
  return db
    .selectFrom("courts")
    .select(["courts.id", "courts.hourlyPriceCents", "courts.opensAt", "courts.closesAt"])
    .where("courts.id", "=", courtId)
    .where("courts.isActive", "=", true)
    .executeTakeFirst();
}

export function insertCourt(newCourt: NewCourt) {
  return db.insertInto("courts").values(newCourt).returning(ADMIN_COURT_COLUMNS).executeTakeFirstOrThrow();
}

export function updateCourtDetails(courtId: number, details: CourtDetails) {
  return db
    .updateTable("courts")
    .set(details)
    .where("courts.id", "=", courtId)
    .returning(ADMIN_COURT_COLUMNS)
    .executeTakeFirst();
}

export function checkIsCourtNameTaken(error: unknown) {
  return (
    error instanceof pg.DatabaseError &&
    error.code === UNIQUE_VIOLATION_CODE &&
    error.constraint === COURT_NAME_UNIQUE_INDEX
  );
}
