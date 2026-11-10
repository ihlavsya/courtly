import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALREADY_CANCELLED_MESSAGE,
  assertBookingCanBeCancelled,
  type BookingSlot,
  listFreeSlots,
} from "@modules/bookings/bookings.policy.ts";

type FreeStartsOptions = {
  bookedSlots?: BookingSlot[];
  now?: Date;
};

const BOOKING_START = new Date("2026-11-10T12:00:00.000Z");
const ACTIVE_BOOKING = { startsAt: BOOKING_START, cancelledAt: null };
const SLOT_CONTEXT = {
  courtHours: { opensAt: "08:00:00", closesAt: "23:00:00" },
  now: new Date("2026-01-01T00:00:00.000Z"),
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

describe("listFreeSlots", () => {
  function listFreeStarts(date: string, { bookedSlots = [], now = SLOT_CONTEXT.now }: FreeStartsOptions = {}) {
    return listFreeSlots({ date, bookedSlots }, { ...SLOT_CONTEXT, now }).map((slot) => slot.startsAt.toISOString());
  }

  it("lists every opening hour of a winter day as a 1-hour slot", () => {
    const freeSlots = listFreeSlots({ date: "2026-11-12", bookedSlots: [] }, SLOT_CONTEXT);

    assert.equal(freeSlots.length, 15);
    assert.deepEqual(freeSlots[0], {
      startsAt: new Date("2026-11-12T08:00:00.000Z"),
      endsAt: new Date("2026-11-12T09:00:00.000Z"),
    });
    assert.equal(freeSlots.at(-1)?.startsAt.toISOString(), "2026-11-12T22:00:00.000Z");
  });

  it("uses Lisbon summer time, so 08:00 in Lisbon is 07:00 UTC", () => {
    const freeStarts = listFreeStarts("2026-07-15");

    assert.equal(freeStarts.length, 15);
    assert.equal(freeStarts[0], "2026-07-15T07:00:00.000Z");
    assert.equal(freeStarts.at(-1), "2026-07-15T21:00:00.000Z");
  });

  it("keeps the opening hours on the days when the clocks change", () => {
    assert.deepEqual(
      [listFreeStarts("2026-03-29"), listFreeStarts("2026-10-25")].map((starts) => [starts.length, starts[0]]),
      [
        [15, "2026-03-29T07:00:00.000Z"],
        [15, "2026-10-25T08:00:00.000Z"],
      ],
    );
  });

  it("removes every hour that a booking covers", () => {
    const twoHourBooking = {
      startsAt: new Date("2026-11-12T10:00:00.000Z"),
      endsAt: new Date("2026-11-12T12:00:00.000Z"),
    };
    const freeStarts = listFreeStarts("2026-11-12", { bookedSlots: [twoHourBooking] });

    assert.equal(freeStarts.length, 13);
    assert.ok(!freeStarts.includes("2026-11-12T10:00:00.000Z"));
    assert.ok(!freeStarts.includes("2026-11-12T11:00:00.000Z"));
    assert.ok(freeStarts.includes("2026-11-12T12:00:00.000Z"));
  });

  it("hides the hours of today that already started", () => {
    const freeStarts = listFreeStarts("2026-11-12", { now: new Date("2026-11-12T14:30:00.000Z") });

    assert.equal(freeStarts[0], "2026-11-12T15:00:00.000Z");
    assert.equal(freeStarts.length, 8);
  });

  it("returns no slots for a past day", () => {
    assert.deepEqual(listFreeStarts("2025-12-31"), []);
  });
});
