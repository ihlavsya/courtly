import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALREADY_CANCELLED_MESSAGE,
  assertBookingCanBeCancelled,
  type BookingSlot,
  buildCourtDayRange,
  listCourtDaySlots,
  type SlotStatus,
} from "@modules/bookings/bookings.policy.ts";

type SlotSummaryOptions = {
  bookedSlots?: BookingSlot[];
  now?: Date;
};

type SlotSummary = {
  startsAt: string;
  status: SlotStatus;
};

const BOOKING_START = new Date("2026-11-10T12:00:00.000Z");
const ACTIVE_BOOKING = { startsAt: BOOKING_START, cancelledAt: null };
const SLOT_CONTEXT = {
  courtHours: { opensAt: "08:00:00", closesAt: "23:00:00" },
  now: new Date("2026-01-01T00:00:00.000Z"),
};
const TWO_HOUR_BOOKING = {
  startsAt: new Date("2026-11-12T10:00:00.000Z"),
  endsAt: new Date("2026-11-12T12:00:00.000Z"),
};
const TOO_LATE_ERROR = {
  name: "Error",
  status: 409,
  message: "A booking can be cancelled only up to 2 hours before its start time",
};

describe("assertBookingCanBeCancelled", () => {
  it("allows cancellation more than 2 hours before the start", () => {
    assert.doesNotThrow(() => {
      assertBookingCanBeCancelled(ACTIVE_BOOKING, new Date("2026-11-10T09:59:59.999Z"));
    });
  });

  it("allows cancellation exactly 2 hours before the start", () => {
    assert.doesNotThrow(() => {
      assertBookingCanBeCancelled(ACTIVE_BOOKING, new Date("2026-11-10T10:00:00.000Z"));
    });
  });

  it("rejects cancellation less than 2 hours before the start with a clear error", () => {
    assert.throws(() => {
      assertBookingCanBeCancelled(ACTIVE_BOOKING, new Date("2026-11-10T10:00:00.001Z"));
    }, TOO_LATE_ERROR);
  });

  it("rejects cancellation after the start", () => {
    assert.throws(() => {
      assertBookingCanBeCancelled(ACTIVE_BOOKING, new Date("2026-11-10T12:30:00.000Z"));
    }, TOO_LATE_ERROR);
  });

  it("rejects cancellation of an already cancelled booking", () => {
    const cancelledBooking = { startsAt: BOOKING_START, cancelledAt: new Date("2026-11-09T08:00:00.000Z") };

    assert.throws(() => {
      assertBookingCanBeCancelled(cancelledBooking, new Date("2026-11-09T09:00:00.000Z"));
    }, { status: 409, message: ALREADY_CANCELLED_MESSAGE });
  });
});

describe("listCourtDaySlots", () => {
  function listSlotSummaries(date: string, { bookedSlots = [], now = SLOT_CONTEXT.now }: SlotSummaryOptions = {}) {
    return listCourtDaySlots({ date, bookedSlots }, { ...SLOT_CONTEXT, now }).map(({ startsAt, status }) => ({
      startsAt: startsAt.toISOString(),
      status,
    }));
  }

  function findStatus(slots: SlotSummary[], startsAt: string) {
    return slots.find((slot) => slot.startsAt === startsAt)?.status;
  }

  it("lists every opening hour of a winter day as a free 1-hour slot", () => {
    const slots = listCourtDaySlots({ date: "2026-11-12", bookedSlots: [] }, SLOT_CONTEXT);

    assert.equal(slots.length, 15);
    assert.deepEqual(slots[0], {
      startsAt: new Date("2026-11-12T08:00:00.000Z"),
      endsAt: new Date("2026-11-12T09:00:00.000Z"),
      status: "free",
    });
    assert.equal(slots.at(-1)?.startsAt.toISOString(), "2026-11-12T22:00:00.000Z");
    assert.ok(slots.every((slot) => slot.status === "free"));
  });

  it("uses Lisbon summer time, so 08:00 in Lisbon is 07:00 UTC", () => {
    const slots = listSlotSummaries("2026-07-15");

    assert.equal(slots.length, 15);
    assert.equal(slots[0]?.startsAt, "2026-07-15T07:00:00.000Z");
    assert.equal(slots.at(-1)?.startsAt, "2026-07-15T21:00:00.000Z");
  });

  it("keeps the opening hours on the days when the clocks change", () => {
    assert.deepEqual(
      [listSlotSummaries("2026-03-29"), listSlotSummaries("2026-10-25")].map((slots) => [
        slots.length,
        slots[0]?.startsAt,
      ]),
      [
        [15, "2026-03-29T07:00:00.000Z"],
        [15, "2026-10-25T08:00:00.000Z"],
      ],
    );
  });

  it("marks every hour that a booking covers as booked", () => {
    const slots = listSlotSummaries("2026-11-12", { bookedSlots: [TWO_HOUR_BOOKING] });

    assert.equal(slots.length, 15);
    assert.equal(findStatus(slots, "2026-11-12T09:00:00.000Z"), "free");
    assert.equal(findStatus(slots, "2026-11-12T10:00:00.000Z"), "booked");
    assert.equal(findStatus(slots, "2026-11-12T11:00:00.000Z"), "booked");
    assert.equal(findStatus(slots, "2026-11-12T12:00:00.000Z"), "free");
  });

  it("marks the hours of today that already started as past", () => {
    const slots = listSlotSummaries("2026-11-12", { now: new Date("2026-11-12T14:30:00.000Z") });

    assert.equal(slots.length, 15);
    assert.equal(slots.filter((slot) => slot.status === "past").length, 7);
    assert.equal(findStatus(slots, "2026-11-12T14:00:00.000Z"), "past");
    assert.equal(findStatus(slots, "2026-11-12T15:00:00.000Z"), "free");
  });

  it("marks a booked hour as past when it already started", () => {
    const slots = listSlotSummaries("2026-11-12", {
      bookedSlots: [TWO_HOUR_BOOKING],
      now: new Date("2026-11-12T14:30:00.000Z"),
    });

    assert.equal(findStatus(slots, "2026-11-12T10:00:00.000Z"), "past");
  });

  it("marks every slot of a past day as past", () => {
    const slots = listSlotSummaries("2025-12-31");

    assert.equal(slots.length, 15);
    assert.ok(slots.every((slot) => slot.status === "past"));
  });
});

describe("buildCourtDayRange", () => {
  function listDayRangeEdges(date: string) {
    const { startsAt, endsAt } = buildCourtDayRange(date);

    return [startsAt.toISOString(), endsAt.toISOString()];
  }

  it("covers a Lisbon winter day from midnight to midnight", () => {
    assert.deepEqual(listDayRangeEdges("2026-11-12"), ["2026-11-12T00:00:00.000Z", "2026-11-13T00:00:00.000Z"]);
  });

  it("uses Lisbon summer time, so midnight in Lisbon is 23:00 UTC of the day before", () => {
    assert.deepEqual(listDayRangeEdges("2026-07-15"), ["2026-07-14T23:00:00.000Z", "2026-07-15T23:00:00.000Z"]);
  });

  it("covers 23 hours on the day the clocks go forward and 25 hours on the day they go back", () => {
    assert.deepEqual(
      [listDayRangeEdges("2026-03-29"), listDayRangeEdges("2026-10-25")],
      [
        ["2026-03-29T00:00:00.000Z", "2026-03-29T23:00:00.000Z"],
        ["2026-10-24T23:00:00.000Z", "2026-10-26T00:00:00.000Z"],
      ],
    );
  });
});
