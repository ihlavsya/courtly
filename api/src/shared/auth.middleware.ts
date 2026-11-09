import { parseCookie } from "cookie";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "@modules/auth/auth.repository.ts";
import { findAuthenticatedUser, SESSION_CONFIG } from "@modules/auth/auth.service.ts";
import { UnauthorizedError } from "@shared/errors.ts";

export type AuthenticatedLocals = {
  authenticatedUser: AuthenticatedUser;
};

export async function requireAuth(req: Request, res: Response<unknown, AuthenticatedLocals>, next: NextFunction) {
  const sessionToken = parseCookie(req.headers.cookie ?? "")[SESSION_CONFIG.cookieName];
  const authenticatedUser = sessionToken === undefined ? undefined : await findAuthenticatedUser(sessionToken);

  if (authenticatedUser === undefined) throw new UnauthorizedError("Authentication required");

  res.locals.authenticatedUser = authenticatedUser;
  next();
}
