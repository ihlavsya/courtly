import {
  checkIsCourtNameTaken,
  findAdminCourt,
  insertCourt,
  updateCourtDetails,
  updateCourtStatus,
} from "@modules/courts/courts.repository.ts";
import type { CourtDetails, CourtStatus, NewCourt } from "@modules/courts/courts.schema.ts";
import { ConflictError, NotFoundError } from "@shared/errors.ts";

export async function getAdminCourt(courtId: number) {
  return requireFoundCourt(await findAdminCourt(courtId));
}

export function createCourt(newCourt: NewCourt) {
  return rejectTakenCourtName(() => insertCourt(newCourt));
}

export async function editCourtDetails(courtId: number, details: CourtDetails) {
  return requireFoundCourt(await rejectTakenCourtName(() => updateCourtDetails(courtId, details)));
}

export async function changeCourtStatus(courtId: number, status: CourtStatus) {
  return requireFoundCourt(await updateCourtStatus(courtId, status));
}

function requireFoundCourt<FoundCourt>(court: FoundCourt | undefined) {
  if (court === undefined) throw new NotFoundError("Court not found");

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
