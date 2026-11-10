import type { Request, Response } from "express";
import {
  availabilityQuerySchema,
  bookingIdParamsSchema,
  createBookingRequestSchema,
} from "@modules/bookings/bookings.schema.ts";
import {
  cancelBooking,
  createBooking,
  listFreeSlotsOfCourt,
  listMyBookings,
} from "@modules/bookings/bookings.service.ts";
import type { AuthenticatedLocals } from "@modules/auth/index.ts";

export async function handleCreateBooking(req: Request, res: Response<unknown, AuthenticatedLocals>) {
  const bookingRequest = createBookingRequestSchema.parse(req.body);
  const booking = await createBooking(res.locals.authenticatedUser.id, bookingRequest);

  res.status(201).json({ booking });
}

export async function handleCancelBooking(req: Request, res: Response<unknown, AuthenticatedLocals>) {
  const { bookingId } = bookingIdParamsSchema.parse(req.params);
  const booking = await cancelBooking(res.locals.authenticatedUser.id, bookingId);

  res.json({ booking });
}

export async function handleListMyBookings(req: Request, res: Response<unknown, AuthenticatedLocals>) {
  const { upcoming, past } = await listMyBookings(res.locals.authenticatedUser.id);

  res.json({ upcoming, past });
}

export async function handleListFreeSlots(req: Request, res: Response) {
  const availabilityQuery = availabilityQuerySchema.parse(req.query);
  const freeSlots = await listFreeSlotsOfCourt(availabilityQuery);

  res.json({ freeSlots });
}
