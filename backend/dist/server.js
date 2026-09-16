"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./config/prisma");
const app = (0, app_1.createApp)();
async function startServer() {
    try {
        // Verify database connection
        await prisma_1.prisma.$connect();
        console.log('Connected to PostgreSQL database successfully.');
        app.listen(env_1.env.PORT, () => {
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
