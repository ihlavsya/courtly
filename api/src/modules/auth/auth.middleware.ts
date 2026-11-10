import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@db/db.generated.ts";
import { readSessionToken } from "@modules/auth/auth.cookie.ts";
import type { AuthenticatedUser } from "@modules/auth/auth.repository.ts";
import { findAuthenticatedUser } from "@modules/auth/auth.service.ts";
import { ForbiddenError, UnauthorizedError } from "@shared/errors.ts";

export type AuthenticatedLocals = {
  authenticatedUser: AuthenticatedUser;
};

export async function requireAuth(req: Request, res: Response<unknown, AuthenticatedLocals>, next: NextFunction) {
  const sessionToken = readSessionToken(req);
  const authenticatedUser = sessionToken === undefined ? undefined : await findAuthenticatedUser(sessionToken);

  if (authenticatedUser === undefined) throw new UnauthorizedError("Authentication required");

  res.locals.authenticatedUser = authenticatedUser;
  next();
}

export function requireRole(requiredRole: UserRole) {
  return (req: Request, res: Response<unknown, AuthenticatedLocals>, next: NextFunction) => {
    if (res.locals.authenticatedUser.role !== requiredRole) throw new ForbiddenError("Access denied");

    next();
  };
}
