import { Router } from "express";
import { handleGetCurrentUser, handleLogin } from "@modules/auth/auth.controller.ts";
import { requireAuth } from "@modules/auth/auth.middleware.ts";

export const authRouter = Router();

authRouter.post("/login", handleLogin);
authRouter.get("/me", requireAuth, handleGetCurrentUser);
