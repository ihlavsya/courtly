import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

const clientErrorSchema = z.object({
  status: z.number().int().min(400).max(499),
  expose: z.literal(true),
  message: z.string(),
});

class ClientError extends Error {
  readonly expose = true;
}

export class UnauthorizedError extends ClientError {
  readonly status = 401;
}

export class ForbiddenError extends ClientError {
  readonly status = 403;
}

export class NotFoundError extends ClientError {
  readonly status = 404;
}

export class ConflictError extends ClientError {
  readonly status = 409;
}

export class UnprocessableEntityError extends ClientError {
  readonly status = 422;
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
