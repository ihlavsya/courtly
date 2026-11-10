import type { Request, Response } from "express";
import { writeSessionCookie } from "@modules/auth/auth.cookie.ts";
import type { AuthenticatedLocals } from "@modules/auth/auth.middleware.ts";
import { loginRequestSchema } from "@modules/auth/auth.schema.ts";
import { logIn } from "@modules/auth/auth.service.ts";

export async function handleLogin(req: Request, res: Response) {
  const credentials = loginRequestSchema.parse(req.body);
  const { user, session } = await logIn(credentials);

  writeSessionCookie(res, session);
  res.json({ user });
}

export function handleGetCurrentUser(req: Request, res: Response<unknown, AuthenticatedLocals>) {
  res.json({ user: res.locals.authenticatedUser });
}
