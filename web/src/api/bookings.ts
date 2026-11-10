import { keepPreviousData, queryOptions, useMutation } from "@tanstack/react-query";
import { postJson, queryClient, requestJson } from "./client.ts";
import type { AdminCourt, SportType } from "./courts.ts";

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

export type DayBooking = Booking & {
  playerEmail: string;
  cancelledAt: string | undefined;
};

export type CourtDayReport = {
  court: Pick<AdminCourt, "id" | "name" | "sportType" | "isActive">;
  expectedRevenueCents: number;
  bookings: DayBooking[];
};

export type DayReport = {
  date: string;
  totalExpectedRevenueCents: number;
  courts: CourtDayReport[];
};

type NewBooking = {
  courtId: number;
  startsAt: string;
  durationHours: DurationHours;
};

type PlayerBookingResponse = Omit<PlayerBooking, "cancelledAt"> & {
  cancelledAt: string | null;
};

type DayBookingResponse = Omit<DayBooking, "cancelledAt"> & {
  cancelledAt: string | null;
};

type DayReportResponse = Omit<DayReport, "courts"> & {
  courts: (Omit<CourtDayReport, "bookings"> & { bookings: DayBookingResponse[] })[];
};

type PlayerBookingsResponse = Record<keyof PlayerBookings, PlayerBookingResponse[]>;

const COURT_DAY_SLOTS_KEY = "courtDaySlots";
const MY_BOOKINGS_KEY = "myBookings";
const DAY_REPORT_KEY = "dayReport";

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

export function buildDayReportQueryOptions(date: string) {
  return queryOptions({
    queryKey: [DAY_REPORT_KEY, date],
    queryFn: () => fetchDayReport(date),
    placeholderData: keepPreviousData,
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

async function fetchDayReport(date: string): Promise<DayReport> {
  const searchParams = new URLSearchParams({ date });
  const dayReport = await requestJson<DayReportResponse>(`/admin/bookings?${searchParams.toString()}`);

  return {
    ...dayReport,
    courts: dayReport.courts.map((courtReport) => ({
      ...courtReport,
      bookings: courtReport.bookings.map(toDayBooking),
    })),
  };
}

function toDayBooking({ cancelledAt, ...booking }: DayBookingResponse): DayBooking {
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
