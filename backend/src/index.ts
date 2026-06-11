import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`🚀 CCDC API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown.
const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
