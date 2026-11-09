import { z } from "zod";

const PASSWORD_MAX_LENGTH = 256;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type LoginCredentials = z.infer<typeof loginRequestSchema>;
