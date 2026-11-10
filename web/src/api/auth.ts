import { queryOptions, useMutation } from "@tanstack/react-query";
import { ApiError, postJson, queryClient, requestJson } from "./client.ts";

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

const HTTP_STATUS_UNAUTHORIZED = 401;

export const currentSessionQueryOptions = queryOptions({
  queryKey: ["currentSession"],
  queryFn: fetchCurrentSession,
});

export function useLogIn() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => postJson<CurrentSession>("/auth/login", credentials),
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
