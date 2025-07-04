import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import healthRouter from './routes/healthRoute';
import { errorHandler, notFound } from './middlewares/error';

// Initialize app
const app:Application = express();

// Security Middlewares
app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin: process.env.CLIENT_DOMAIN?.split(",") ?? [],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
  })
);

// Body parsers and cookie parser
app.use(express.json({ limit: "10kb" })); // Adjust based on your needs
app.use(cookieParser(process.env.COOKIE_SECRET));

// Routes
app.use('/health', healthRouter);

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler as (err: Error, req: Request, res: Response, next: NextFunction) => void);

export default app;