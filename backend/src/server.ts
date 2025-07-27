import 'dotenv/config';

import connectToDB from './config/connectToDb.js';
import app from './app.js';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import { seedAdminAccount } from './services/seedAdminAccount.js';

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled Rejection');
  process.exit(1);
});

const PORT = process.env.PORT ?? 4000;

await connectToDB();

await seedAdminAccount();

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// 6) Graceful shutdown handlers
for (let sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    logger.info(`${sig} received, shutting down gracefully…`);
    server.close(async (err?: Error) => {
      if (err) logger.error({ err }, 'Error closing HTTP server');
      // Close MongoDB connection
      try {
        await mongoose.disconnect();
        logger.info('MongoDB connection closed');
      } catch (dbErr) {
        logger.error({ dbErr }, 'Error disconnecting MongoDB');
      }
      process.exit(0);
    });
  });
}
