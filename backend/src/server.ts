import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { initSocketServer } from './socket';

const app = createApp();
const httpServer = http.createServer(app);
initSocketServer(httpServer);

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Connected to PostgreSQL database successfully.');

    httpServer.listen(env.PORT, () => {
      console.log(`SwapWear backend running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
      console.log(`Health check available at http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
}

startServer();
