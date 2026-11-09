import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

const clientErrorSchema = z.object({
  status: z.number().int().min(400).max(499),
  expose: z.literal(true),
  message: z.string(),
});

export class UnauthorizedError extends Error {
  readonly status = 401;
  readonly expose = true;
}

export function handleError(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", fields: z.flattenError(error).fieldErrors });
    return;
  }

  const clientError = clientErrorSchema.safeParse(error);
  if (clientError.success) {
    res.status(clientError.data.status).json({ error: clientError.data.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
