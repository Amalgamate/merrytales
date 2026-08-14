import { app } from './app';
import { config } from './config';
import { db } from './db';

const server = app.listen(config.PORT, () => {
  console.log(`Merry Tales API running at http://localhost:${config.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
