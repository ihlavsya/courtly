import { useNavigate } from "@tanstack/react-router";
import type { SubmitEvent } from "react";
import { useState } from "react";
import type { LoginCredentials } from "./api/auth.ts";
import { useLogIn } from "./api/auth.ts";
import { ApiError } from "./api/client.ts";
import { INPUT_CLASS_NAME } from "./styles.ts";

const EMPTY_CREDENTIALS: LoginCredentials = { email: "", password: "" };
const FIRST_SERVER_ERROR_STATUS = 500;

export function LoginPage() {
  const logIn = useLogIn();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(EMPTY_CREDENTIALS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    logIn.mutate(credentials, {
      onSuccess: () => {
        void navigate({ to: "/" });
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-emerald-700">Courtly</h1>
        <label className="block space-y-1 text-sm font-medium">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className={INPUT_CLASS_NAME}
            value={credentials.email}
            onChange={(event) => {
              setCredentials({ ...credentials, email: event.target.value });
            }}
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={INPUT_CLASS_NAME}
            value={credentials.password}
            onChange={(event) => {
              setCredentials({ ...credentials, password: event.target.value });
            }}
          />
        </label>
        {logIn.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getLoginErrorMessage(logIn.error)}
          </p>
        )}
        <button
          type="submit"
          disabled={logIn.isPending}
          className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {logIn.isPending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}

function getLoginErrorMessage(error: Error) {
  if (error instanceof ApiError && error.status < FIRST_SERVER_ERROR_STATUS) return "Invalid email or password";

  return "Something went wrong. Try again.";
}
