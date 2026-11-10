import { db } from "@shared/db.ts";

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

export function findActiveCourt(courtId: number) {
  return db
    .selectFrom("courts")
    .select(["courts.id", "courts.hourlyPriceCents", "courts.opensAt", "courts.closesAt"])
    .where("courts.id", "=", courtId)
    .where("courts.isActive", "=", true)
    .executeTakeFirst();
}
