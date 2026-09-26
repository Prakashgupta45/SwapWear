import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import listingRoutes from './routes/listing.routes';
import { errorHandler } from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';
import { authorizeRoles } from './middleware/authorize.middleware';
import { AuthenticatedRequest } from './types';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'swapwear-backend', timestamp: new Date() });
  });

  // Auth & Phase 2 routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/listings', listingRoutes);

  // Protected Admin route for testing role-based authorization
  app.get(
    '/api/admin/check',
    authenticate,
    authorizeRoles('ADMIN'),
    (req: AuthenticatedRequest, res) => {
      res.status(200).json({
        success: true,
        message: 'Admin access granted.',
        user: req.user,
      });
    }
  );

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
