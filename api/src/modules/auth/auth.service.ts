import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hash, verify } from "argon2";
import type { AuthenticatedUser } from "@modules/auth/auth.repository.ts";
import {
  findUserByActiveSessionId,
  findUserWithPasswordHash,
  insertSession,
} from "@modules/auth/auth.repository.ts";
import type { LoginCredentials } from "@modules/auth/auth.schema.ts";
import { UnauthorizedError } from "@shared/errors.ts";

export const SESSION_CONFIG = {
  cookieName: "session",
  lifetimeMs: 7 * 24 * 60 * 60 * 1000,
  tokenByteLength: 32,
} as const;

const DUMMY_PASSWORD_HASH = await hash(randomUUID());

export async function logIn(credentials: LoginCredentials) {
  const user = await findUserWithPasswordHash(credentials.email);
  const isPasswordCorrect = await verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, credentials.password);

  if (user === undefined || !isPasswordCorrect) throw new UnauthorizedError("Invalid email or password");

  const session = await startSession(user.id);
  const authenticatedUser: AuthenticatedUser = { id: user.id, email: user.email, role: user.role };

  return { user: authenticatedUser, session };
}

export function findAuthenticatedUser(sessionToken: string) {
  return findUserByActiveSessionId(hashSessionToken(sessionToken));
}

async function startSession(userId: string) {
  const token = randomBytes(SESSION_CONFIG.tokenByteLength).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_CONFIG.lifetimeMs);

  await insertSession({ id: hashSessionToken(token), userId, expiresAt });

  return { token, expiresAt };
}

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}
