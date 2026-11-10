import { Router } from "express";
import {
  handleCancelBooking,
  handleCreateBooking,
  handleListFreeSlots,
  handleListMyBookings,
} from "@modules/bookings/bookings.controller.ts";
import { requireAuth, requireRole } from "@modules/auth/index.ts";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth, requireRole("player"));

bookingsRouter.get("/", handleListMyBookings);
bookingsRouter.get("/availability", handleListFreeSlots);
bookingsRouter.post("/", handleCreateBooking);
bookingsRouter.post("/:bookingId/cancel", handleCancelBooking);
