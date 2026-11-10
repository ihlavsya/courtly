import type { Selectable } from "kysely";
import type { Courts } from "@db/db.generated.ts";
import type { TimeRange } from "@modules/bookings/bookings.policy.ts";

export type DayReportCourt = Pick<Selectable<Courts>, "id" | "name" | "sportType" | "isActive">;

export type DayReportBooking = TimeRange & {
  id: string;
  courtId: number;
  priceCents: number;
  cancelledAt: Date | null;
  playerEmail: string;
};

type DayReportSources = {
  courts: DayReportCourt[];
  bookings: DayReportBooking[];
};

export function buildDayReport({ courts, bookings }: DayReportSources) {
  const courtReports = courts.map((court) =>
    buildCourtReport(
      court,
      bookings.filter((booking) => booking.courtId === court.id),
    ),
  );
  const totalExpectedRevenueCents = courtReports.reduce(
    (totalCents, courtReport) => totalCents + courtReport.expectedRevenueCents,
    0,
  );

  return { totalExpectedRevenueCents, courts: courtReports };
}

function buildCourtReport(court: DayReportCourt, courtBookings: DayReportBooking[]) {
  return {
    court,
    expectedRevenueCents: computeExpectedRevenueCents(courtBookings),
    bookings: courtBookings,
  };
}

function computeExpectedRevenueCents(bookings: DayReportBooking[]) {
  return bookings
    .filter((booking) => booking.cancelledAt === null)
    .reduce((revenueCents, booking) => revenueCents + booking.priceCents, 0);
}
