import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALREADY_CANCELLED_MESSAGE, assertBookingCanBeCancelled } from "@modules/bookings/bookings.policy.ts";

const BOOKING_START = new Date("2026-11-10T12:00:00.000Z");
const ACTIVE_BOOKING = { startsAt: BOOKING_START, cancelledAt: null };
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
