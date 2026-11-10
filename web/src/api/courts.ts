import { queryOptions } from "@tanstack/react-query";
import { requestJson } from "./client.ts";

export type SportType = "tennis" | "padel" | "squash" | "badminton" | "pickleball";

export type Court = {
  id: number;
  name: string;
  sportType: SportType;
  hourlyPriceCents: number;
};

export const activeCourtsQueryOptions = queryOptions({
  queryKey: ["activeCourts"],
  queryFn: fetchActiveCourts,
});

async function fetchActiveCourts() {
  const { courts } = await requestJson<{ courts: Court[] }>("/courts");

  return courts;
}
