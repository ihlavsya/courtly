import { QueryClient } from "@tanstack/react-query";

type ErrorBody = {
  error?: unknown;
};

const API_BASE_PATH = "/api";
const FALLBACK_ERROR_MESSAGE = "Something went wrong. Try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | undefined;

  constructor(status: number, serverMessage?: string) {
    super(`API request failed with status ${String(status)}`);
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export const queryClient = new QueryClient();

export async function requestJson<ResponseBody>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_PATH}${path}`, init);

  if (!response.ok) throw new ApiError(response.status, await readServerMessage(response));

  return (await response.json()) as ResponseBody;
}

export function postJson<ResponseBody>(path: string, body: unknown) {
  return sendJson<ResponseBody>("POST", path, body);
}

export function patchJson<ResponseBody>(path: string, body: unknown) {
  return sendJson<ResponseBody>("PATCH", path, body);
}

export function readErrorMessage(error: Error) {
  if (error instanceof ApiError && error.serverMessage !== undefined) return error.serverMessage;

  return FALLBACK_ERROR_MESSAGE;
}

function sendJson<ResponseBody>(method: "POST" | "PATCH", path: string, body: unknown) {
  return requestJson<ResponseBody>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readServerMessage(response: Response) {
  const body = (await response.json().catch(() => undefined)) as ErrorBody | undefined;

  return typeof body?.error === "string" ? body.error : undefined;
}
