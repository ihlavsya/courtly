import type { Request, Response } from "express";
import { listActiveCourts, listAdminCourts } from "@modules/courts/courts.repository.ts";
import {
  courtDetailsSchema,
  courtIdParamsSchema,
  courtStatusSchema,
  newCourtSchema,
} from "@modules/courts/courts.schema.ts";
import { changeCourtStatus, createCourt, editCourtDetails, getAdminCourt } from "@modules/courts/courts.service.ts";

export async function handleListActiveCourts(req: Request, res: Response) {
  const courts = await listActiveCourts();

  res.json({ courts });
}

export async function handleListAdminCourts(req: Request, res: Response) {
  const courts = await listAdminCourts();

  res.json({ courts });
}

export async function handleGetAdminCourt(req: Request, res: Response) {
  const { courtId } = courtIdParamsSchema.parse(req.params);
  const court = await getAdminCourt(courtId);

  res.json({ court });
}

export async function handleCreateCourt(req: Request, res: Response) {
  const newCourt = newCourtSchema.parse(req.body);
  const court = await createCourt(newCourt);

  res.status(201).json({ court });
}

export async function handleEditCourtDetails(req: Request, res: Response) {
  const { courtId } = courtIdParamsSchema.parse(req.params);
  const details = courtDetailsSchema.parse(req.body);
  const court = await editCourtDetails(courtId, details);

  res.json({ court });
}

export async function handleChangeCourtStatus(req: Request, res: Response) {
  const { courtId } = courtIdParamsSchema.parse(req.params);
  const status = courtStatusSchema.parse(req.body);
  const court = await changeCourtStatus(courtId, status);

  res.json({ court });
}
