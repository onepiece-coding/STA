import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export default async function connectToDB():Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.error("✖️ MONGO_URI is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    logger.info("Connected to MongoDB ^_^");

    process.on("SIGINT", async ():Promise<void> => {
      await mongoose.disconnect();
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.info("Database connection failed:", err.message);
    process.exit(1);
  }
};