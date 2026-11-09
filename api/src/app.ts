import express from "express";
import { authRouter } from "@modules/auth/index.ts";
import { env } from "@shared/env.ts";
import { handleError } from "@shared/errors.ts";

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/auth", authRouter);
app.use(handleError);

app.listen(env.PORT, (error) => {
  if (error !== undefined) throw error;
  console.log(`API listening on port ${String(env.PORT)}`);
});
