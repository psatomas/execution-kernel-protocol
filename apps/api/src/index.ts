import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import type { PublicClient } from "viem";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { createKernelService } from "./services/kernelService.ts";
import { intentsRoutes } from "./routes/intentsRoutes.ts";
import { modulesRoutes } from "./routes/modulesRoutes.ts";
import { metricsRoutes } from "./routes/metricsRoutes.ts";

declare module "fastify" {
  interface FastifyInstance {
    kernel: ExecutionKernelClient;
    publicClient: PublicClient;
  }
}

/**
 * Builds the Fastify app without starting it listening -- kept separate
 * from the listen() call below so this can be imported and driven directly
 * (e.g. via app.inject(...)) without binding a real port.
 */
export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  // Read-only GETs, no credentials/cookies -- open CORS is fine here.
  // apps/frontend calls this from a different port (3000) in local dev.
  app.register(cors, { origin: true });

  const { kernel, publicClient } = createKernelService();
  app.decorate("kernel", kernel);
  app.decorate("publicClient", publicClient);

  app.get("/health", async () => ({ status: "ok" }));

  app.register(intentsRoutes, { prefix: "/intents" });
  app.register(modulesRoutes, { prefix: "/modules" });
  app.register(metricsRoutes, { prefix: "/metrics" });

  return app;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const app = buildServer();
  // 3000 collides with apps/frontend's default `next dev`/`next start` port
  // -- the two are meant to run side by side, so default this one off it.
  const port = Number(process.env.PORT ?? 4000);

  app.listen({ port, host: "0.0.0.0" }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}
