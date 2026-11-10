import { Router } from "express";
import { handleListActiveCourts } from "@modules/courts/courts.controller.ts";
import { requireAuth, requireRole } from "@modules/auth/index.ts";

export const courtsRouter = Router();

courtsRouter.use(requireAuth, requireRole("player"));

courtsRouter.get("/", handleListActiveCourts);
