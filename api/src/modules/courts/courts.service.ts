import {
  checkIsCourtNameTaken,
  findAdminCourt,
  insertCourt,
  updateCourtDetails,
} from "@modules/courts/courts.repository.ts";
import type { CourtDetails, NewCourt } from "@modules/courts/courts.schema.ts";
import { ConflictError, NotFoundError } from "@shared/errors.ts";

const COURT_NOT_FOUND_MESSAGE = "Court not found";

export async function getAdminCourt(courtId: number) {
  const court = await findAdminCourt(courtId);

  if (court === undefined) throw new NotFoundError(COURT_NOT_FOUND_MESSAGE);

  return court;
}

export function createCourt(newCourt: NewCourt) {
  return rejectTakenCourtName(() => insertCourt(newCourt));
}

export async function editCourtDetails(courtId: number, details: CourtDetails) {
  const court = await rejectTakenCourtName(() => updateCourtDetails(courtId, details));

  if (court === undefined) throw new NotFoundError(COURT_NOT_FOUND_MESSAGE);

  return court;
}

async function rejectTakenCourtName<WrittenCourt>(writeCourt: () => Promise<WrittenCourt>) {
  try {
    return await writeCourt();
  } catch (error) {
    if (checkIsCourtNameTaken(error)) throw new ConflictError("A court with this name already exists");
    throw error;
  }
}
