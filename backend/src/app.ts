import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import listingRoutes from './routes/listing.routes';
import swapRequestRoutes from './routes/swapRequest.routes';
import { conversationRoutes, messageRoutes } from './routes/chat.routes';
import matchRoutes from './routes/match.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/aiRecommendation.routes';
import { errorHandler } from './middleware/error.middleware';

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

  // Auth, Profile, Listings, Swap Requests, Chat, and Match routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/swap-requests', swapRequestRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
