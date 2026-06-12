import { createApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = await createApp();
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(
    `🚀 CCDC API on http://localhost:${env.port} (${env.nodeEnv}) — docs at /docs`
  );

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received — shutting down...`);
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
