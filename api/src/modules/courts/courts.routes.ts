import { Router } from "express";
import {
  handleCreateCourt,
  handleEditCourtDetails,
  handleGetAdminCourt,
  handleListActiveCourts,
  handleListAdminCourts,
} from "@modules/courts/courts.controller.ts";
import { requireAuth, requireRole } from "@modules/auth/index.ts";

export const courtsRouter = Router();

courtsRouter.use(requireAuth, requireRole("player"));

courtsRouter.get("/", handleListActiveCourts);

export const adminCourtsRouter = Router();

adminCourtsRouter.use(requireAuth, requireRole("admin"));

adminCourtsRouter.get("/", handleListAdminCourts);
adminCourtsRouter.get("/:courtId", handleGetAdminCourt);
adminCourtsRouter.post("/", handleCreateCourt);
adminCourtsRouter.patch("/:courtId", handleEditCourtDetails);
