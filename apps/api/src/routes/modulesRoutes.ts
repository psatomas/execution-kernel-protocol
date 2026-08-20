import type { FastifyPluginAsync } from "fastify";
import { listModules, predictWinner } from "../controllers/modulesController.ts";

export const modulesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:intentType", listModules);
  app.get("/:intentType/predict", predictWinner);
};
