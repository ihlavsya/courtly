import { z } from "zod";

export const createBookingRequestSchema = z.object({
  courtId: z.int32().positive(),
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  durationHours: z.literal([1, 2]),
});

export const bookingIdParamsSchema = z.object({
  bookingId: z.uuid(),
});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
