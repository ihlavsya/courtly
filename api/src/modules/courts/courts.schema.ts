import { z } from "zod";
import type { SportType } from "@db/db.generated.ts";

const COURT_NAME_MAX_LENGTH = 100;
const HOURLY_PRICE_MAX_CENTS = 100_000;

const SPORT_TYPES: Record<SportType, SportType> = {
  tennis: "tennis",
  padel: "padel",
  squash: "squash",
  badminton: "badminton",
  pickleball: "pickleball",
};

export const courtDetailsSchema = z.object({
  name: z.string().trim().min(1).max(COURT_NAME_MAX_LENGTH),
  hourlyPriceCents: z.int32().positive().max(HOURLY_PRICE_MAX_CENTS),
});

export const newCourtSchema = courtDetailsSchema.extend({
  sportType: z.enum(SPORT_TYPES),
});

export const courtIdParamsSchema = z.object({
  courtId: z.coerce.number().pipe(z.int32().positive()),
});

export type CourtDetails = z.infer<typeof courtDetailsSchema>;

export type NewCourt = z.infer<typeof newCourtSchema>;
