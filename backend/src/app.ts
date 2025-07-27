import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import healthRouter from './routes/healthRoute.js';
import authRouter from './routes/authRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import productRouter from './routes/productRoute.js';
import supplyRouter from './routes/supplyRoute.js';
import cityRouter from './routes/cityRoute.js';
import sectorRouter from './routes/sectorRoute.js';
import userRouter from './routes/userRoute.js';
import clientRouter from './routes/clientRoute.js';
import saleRouter from './routes/saleRoute.js';
import orderRouter from './routes/orderRoute.js';
import statsRouter from './routes/statsRoute.js';
import adminRouter from './routes/adminRoute.js';
import instantSaleRouter from './routes/instantSaleRoute.js';

import { errorHandler, notFound } from './middlewares/error.js';

// Initialize app
const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin: process.env.CLIENT_DOMAIN?.split(',') ?? [],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
  }),
);

// Body parsers and cookie parser
app.use(express.json({ limit: '10kb' })); // Adjust based on your needs
app.use(cookieParser(process.env.COOKIE_SECRET));

// Routes
app.use('/', healthRouter); // done
app.use('/api/v1/auth', authRouter); // done
app.use('/api/v1/categories', categoryRouter); // done
app.use('/api/v1/products', productRouter); // done
app.use('/api/v1/supplies', supplyRouter); // done
app.use('/api/v1/cities', cityRouter); // done
app.use('/api/v1/sectors', sectorRouter); // done
app.use('/api/v1/users', userRouter); // done
app.use('/api/v1/clients', clientRouter); // done
app.use('/api/v1/sales', saleRouter); // done
app.use('/api/v1/instant-sales', instantSaleRouter); // done
app.use('/api/v1/orders', orderRouter); // done
app.use('/api/v1/stats', statsRouter); // done
app.use('/api/v1/admin', adminRouter); //
// Monday => The Meet

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(
  errorHandler as (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void,
);

export default app;
