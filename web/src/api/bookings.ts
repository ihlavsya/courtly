import { queryOptions, useMutation } from "@tanstack/react-query";
import { postJson, queryClient, requestJson } from "./client.ts";
import type { SportType } from "./courts.ts";

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

export type PlayerBooking = Booking & {
  courtName: string;
  sportType: SportType;
  cancelledAt: string | undefined;
};

export type PlayerBookings = {
  upcoming: PlayerBooking[];
  past: PlayerBooking[];
};

type NewBooking = {
  courtId: number;
  startsAt: string;
  durationHours: DurationHours;
};

type PlayerBookingResponse = Omit<PlayerBooking, "cancelledAt"> & {
  cancelledAt: string | null;
};

type PlayerBookingsResponse = Record<keyof PlayerBookings, PlayerBookingResponse[]>;

const COURT_DAY_SLOTS_KEY = "courtDaySlots";
const MY_BOOKINGS_KEY = "myBookings";

export const myBookingsQueryOptions = queryOptions({
  queryKey: [MY_BOOKINGS_KEY],
  queryFn: fetchMyBookings,
});

export function buildCourtDaySlotsQueryOptions(courtId: number, date: string) {
  return queryOptions({
    queryKey: [COURT_DAY_SLOTS_KEY, courtId, date],
    queryFn: () => fetchCourtDaySlots(courtId, date),
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: createBooking,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [COURT_DAY_SLOTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [MY_BOOKINGS_KEY] }),
      ]),
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: cancelBooking,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [COURT_DAY_SLOTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [MY_BOOKINGS_KEY] }),
      ]),
  });
}

async function fetchMyBookings(): Promise<PlayerBookings> {
  const { upcoming, past } = await requestJson<PlayerBookingsResponse>("/bookings");

  return { upcoming: upcoming.map(toPlayerBooking), past: past.map(toPlayerBooking) };
}

function toPlayerBooking({ cancelledAt, ...booking }: PlayerBookingResponse): PlayerBooking {
  return { ...booking, cancelledAt: cancelledAt ?? undefined };
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

async function cancelBooking(bookingId: string) {
  await postJson(`/bookings/${bookingId}/cancel`, {});
}
