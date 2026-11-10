import type { Request, Response } from "express";
import { listActiveCourts } from "@modules/courts/courts.repository.ts";

export async function handleListActiveCourts(req: Request, res: Response) {
  const courts = await listActiveCourts();

  res.json({ courts });
}
