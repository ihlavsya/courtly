import { parseCookie } from "cookie";
import type { CookieOptions, Request, Response } from "express";
import { env } from "@shared/env.ts";

type SessionCookie = {
  token: string;
  expiresAt: Date;
};

const SESSION_COOKIE_NAME = "session";

export function readSessionToken(req: Request) {
  return parseCookie(req.headers.cookie ?? "")[SESSION_COOKIE_NAME];
}

export function writeSessionCookie(res: Response, { token, expiresAt }: SessionCookie) {
  res.cookie(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(expiresAt));
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
