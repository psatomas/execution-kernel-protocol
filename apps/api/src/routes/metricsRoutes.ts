import type { FastifyPluginAsync } from "fastify";
import { getExecutionMetrics, getModuleWinRate } from "../controllers/metricsController.ts";

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/executions", getExecutionMetrics);
  app.get("/executions/:intentType/win-rate/:module", getModuleWinRate);
};
