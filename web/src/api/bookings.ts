import { queryOptions, useMutation } from "@tanstack/react-query";
import { postJson, queryClient, requestJson } from "./client.ts";

export type TimeRange = {
  startsAt: string;
  endsAt: string;
};

export type CourtSlot = TimeRange & {
  status: "free" | "booked" | "past";
};

export type DurationHours = 1 | 2;

export type Booking = TimeRange & {
  id: string;
  priceCents: number;
};

type NewBooking = {
  courtId: number;
  startsAt: string;
  durationHours: DurationHours;
};

const COURT_DAY_SLOTS_KEY = "courtDaySlots";

export function buildCourtDaySlotsQueryOptions(courtId: number, date: string) {
  return queryOptions({
    queryKey: [COURT_DAY_SLOTS_KEY, courtId, date],
    queryFn: () => fetchCourtDaySlots(courtId, date),
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: createBooking,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [COURT_DAY_SLOTS_KEY] }),
  });
}

async function fetchCourtDaySlots(courtId: number, date: string) {
  const searchParams = new URLSearchParams({ courtId: String(courtId), date });
  const { slots } = await requestJson<{ slots: CourtSlot[] }>(`/bookings/availability?${searchParams.toString()}`);

  return slots;
}

async function createBooking(newBooking: NewBooking) {
  const { booking } = await postJson<{ booking: Booking }>("/bookings", newBooking);

  return booking;
}
