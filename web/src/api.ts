import { QueryClient, queryOptions, useMutation } from "@tanstack/react-query";

export type UserRole = "admin" | "player";

export type LoginCredentials = {
  email: string;
  password: string;
};

type User = {
  id: string;
  email: string;
  role: UserRole;
};

type CurrentSession = {
  user: User | undefined;
};

const API_BASE_PATH = "/api";
const HTTP_STATUS_UNAUTHORIZED = 401;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed with status ${String(status)}`);
    this.status = status;
  }
}

export const queryClient = new QueryClient();

export const currentSessionQueryOptions = queryOptions({
  queryKey: ["currentSession"],
  queryFn: fetchCurrentSession,
});

export function useLogIn() {
  return useMutation({
    mutationFn: logIn,
    onSuccess: (session) => {
      queryClient.setQueryData(currentSessionQueryOptions.queryKey, session);
    },
  });
}

async function fetchCurrentSession(): Promise<CurrentSession> {
  try {
    return await requestJson<CurrentSession>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === HTTP_STATUS_UNAUTHORIZED) return { user: undefined };
    throw error;
  }
}

function logIn(credentials: LoginCredentials) {
  return requestJson<CurrentSession>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

async function requestJson<ResponseBody>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_PATH}${path}`, init);

  if (!response.ok) throw new ApiError(response.status);

  return (await response.json()) as ResponseBody;
}
