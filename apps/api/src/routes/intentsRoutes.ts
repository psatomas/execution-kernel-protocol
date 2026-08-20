import type { FastifyPluginAsync } from "fastify";
import { getIntent, listIntents } from "../controllers/intentsController.ts";

export const intentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", listIntents);
  app.get("/:intentType", getIntent);
};
