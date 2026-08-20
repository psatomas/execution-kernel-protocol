import type { FastifyPluginAsync } from "fastify";
import { listExecutions } from "../controllers/executionsController.ts";

export const executionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", listExecutions);
};
