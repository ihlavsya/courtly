import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDayReport, type DayReportBooking } from "@modules/bookings/bookings.day-report.ts";

const CENTER_COURT = { id: 1, name: "Center Court", sportType: "tennis", isActive: true } as const;
const SHUTTLE_HALL = { id: 2, name: "Shuttle Hall", sportType: "badminton", isActive: false } as const;

const MORNING_BOOKING: DayReportBooking = {
  id: "booking-1",
  courtId: CENTER_COURT.id,
  startsAt: new Date("2026-11-12T10:00:00.000Z"),
  endsAt: new Date("2026-11-12T11:00:00.000Z"),
  priceCents: 3500,
  cancelledAt: null,
  playerEmail: "player@courtly.test",
};

const EVENING_BOOKING: DayReportBooking = {
  ...MORNING_BOOKING,
  id: "booking-2",
  startsAt: new Date("2026-11-12T18:00:00.000Z"),
  endsAt: new Date("2026-11-12T20:00:00.000Z"),
  priceCents: 7000,
};

const CANCELLED_BOOKING: DayReportBooking = {
  ...MORNING_BOOKING,
  id: "booking-3",
  courtId: SHUTTLE_HALL.id,
  priceCents: 1800,
  cancelledAt: new Date("2026-11-11T09:00:00.000Z"),
};

describe("buildDayReport", () => {
  it("groups the bookings under their court", () => {
    const report = buildDayReport({
      courts: [CENTER_COURT, SHUTTLE_HALL],
      bookings: [MORNING_BOOKING, CANCELLED_BOOKING, EVENING_BOOKING],
    });

    assert.deepEqual(
      report.courts.map(({ court, bookings }) => [court.id, bookings.map((booking) => booking.id)]),
      [
        [CENTER_COURT.id, ["booking-1", "booking-2"]],
        [SHUTTLE_HALL.id, ["booking-3"]],
      ],
    );
  });

  it("counts only the bookings that are not cancelled in the revenue", () => {
    const report = buildDayReport({
      courts: [CENTER_COURT, SHUTTLE_HALL],
      bookings: [MORNING_BOOKING, CANCELLED_BOOKING, EVENING_BOOKING],
    });

    assert.deepEqual(
      report.courts.map((courtReport) => courtReport.expectedRevenueCents),
      [10500, 0],
    );
    assert.equal(report.totalExpectedRevenueCents, 10500);
  });

  it("shows a court without bookings with no revenue", () => {
    const report = buildDayReport({ courts: [CENTER_COURT], bookings: [] });

    assert.deepEqual(report, {
      totalExpectedRevenueCents: 0,
      courts: [
        {
          court: { id: 1, name: "Center Court", sportType: "tennis", status: "active" },
          expectedRevenueCents: 0,
          bookings: [],
        },
      ],
    });
  });

  it("marks an inactive court as deactivated", () => {
    const report = buildDayReport({ courts: [SHUTTLE_HALL], bookings: [] });

    assert.equal(report.courts[0]?.court.status, "deactivated");
  });
});
