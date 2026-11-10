import type { CookieOptions, Request, Response } from "express";
import { loginRequestSchema } from "@modules/auth/auth.schema.ts";
import { logIn, SESSION_CONFIG } from "@modules/auth/auth.service.ts";
import type { AuthenticatedLocals } from "@modules/auth/auth.middleware.ts";
import { env } from "@shared/env.ts";

export async function handleLogin(req: Request, res: Response) {
  const credentials = loginRequestSchema.parse(req.body);
  const { user, session } = await logIn(credentials);

  res.cookie(SESSION_CONFIG.cookieName, session.token, buildSessionCookieOptions(session.expiresAt));
  res.json({ user });
}

export function handleGetCurrentUser(req: Request, res: Response<unknown, AuthenticatedLocals>) {
  res.json({ user: res.locals.authenticatedUser });
}

function buildSessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
