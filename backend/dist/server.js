"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./config/prisma");
const socket_1 = require("./socket");
const app = (0, app_1.createApp)();
const httpServer = http_1.default.createServer(app);
(0, socket_1.initSocketServer)(httpServer);
async function startServer() {
    try {
        // Verify database connection
        await prisma_1.prisma.$connect();
        console.log('Connected to PostgreSQL database successfully.');
        httpServer.listen(env_1.env.PORT, () => {
            console.log(`SwapWear backend running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode.`);
            console.log(`Health check available at http://localhost:${env_1.env.PORT}/api/health`);
        });
    }
    catch (error) {
        console.error('Failed to connect to database or start server:', error);
        process.exit(1);
    }
}
startServer();
