import { queryOptions, useMutation } from "@tanstack/react-query";
import { patchJson, postJson, queryClient, requestJson } from "./client.ts";

export type SportType = "tennis" | "padel" | "squash" | "badminton" | "pickleball";

export type Court = {
  id: number;
  name: string;
  sportType: SportType;
  hourlyPriceCents: number;
};

export type AdminCourt = Court & {
  isActive: boolean;
};

export type CourtDetails = Pick<Court, "name" | "hourlyPriceCents">;

export type NewCourt = CourtDetails & Pick<Court, "sportType">;

type CourtDetailsEdit = {
  courtId: number;
  details: CourtDetails;
};

export const COURT_NAME_MAX_LENGTH = 100;
export const HOURLY_PRICE_MIN_EUROS = 0.01;
export const HOURLY_PRICE_MAX_EUROS = 1000;

const ADMIN_COURTS_KEY = "adminCourts";
const ADMIN_COURTS_PATH = "/admin/courts";

export const activeCourtsQueryOptions = queryOptions({
  queryKey: ["activeCourts"],
  queryFn: fetchActiveCourts,
});

export const adminCourtsQueryOptions = queryOptions({
  queryKey: [ADMIN_COURTS_KEY],
  queryFn: fetchAdminCourts,
});

export function buildAdminCourtQueryOptions(courtId: number) {
  return queryOptions({
    queryKey: [ADMIN_COURTS_KEY, courtId],
    queryFn: () => fetchAdminCourt(courtId),
  });
}

export function useCreateCourt() {
  return useMutation({
    mutationFn: createCourt,
    onSuccess: invalidateAdminCourts,
  });
}

export function useEditCourtDetails() {
  return useMutation({
    mutationFn: editCourtDetails,
    onSuccess: invalidateAdminCourts,
  });
}

async function fetchActiveCourts() {
  const { courts } = await requestJson<{ courts: Court[] }>("/courts");

  return courts;
}

async function fetchAdminCourts() {
  const { courts } = await requestJson<{ courts: AdminCourt[] }>(ADMIN_COURTS_PATH);

  return courts;
}

async function fetchAdminCourt(courtId: number) {
  const { court } = await requestJson<{ court: AdminCourt }>(`${ADMIN_COURTS_PATH}/${String(courtId)}`);

  return court;
}

async function createCourt(newCourt: NewCourt) {
  const { court } = await postJson<{ court: AdminCourt }>(ADMIN_COURTS_PATH, newCourt);

  return court;
}

async function editCourtDetails({ courtId, details }: CourtDetailsEdit) {
  const { court } = await patchJson<{ court: AdminCourt }>(`${ADMIN_COURTS_PATH}/${String(courtId)}`, details);

  return court;
}

function invalidateAdminCourts() {
  return queryClient.invalidateQueries({ queryKey: [ADMIN_COURTS_KEY] });
}
