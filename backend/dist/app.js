"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const listing_routes_1 = __importDefault(require("./routes/listing.routes"));
const swapRequest_routes_1 = __importDefault(require("./routes/swapRequest.routes"));
const chat_routes_1 = require("./routes/chat.routes");
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
const authorize_middleware_1 = require("./middleware/authorize.middleware");
const createApp = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: env_1.env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use((0, cookie_parser_1.default)(env_1.env.COOKIE_SECRET));
    app.use(express_1.default.json());
    // Health check
    app.get('/api/health', (_req, res) => {
        res.status(200).json({ status: 'ok', service: 'swapwear-backend', timestamp: new Date() });
    });
    // Auth, Profile, Listings, Swap Requests, Chat, and Match routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/profile', profile_routes_1.default);
    app.use('/api/listings', listing_routes_1.default);
    app.use('/api/swap-requests', swapRequest_routes_1.default);
    app.use('/api/conversations', chat_routes_1.conversationRoutes);
    app.use('/api/messages', chat_routes_1.messageRoutes);
    app.use('/api/matches', match_routes_1.default);
    // Protected Admin route for testing role-based authorization
    app.get('/api/admin/check', auth_middleware_1.authenticate, (0, authorize_middleware_1.authorizeRoles)('ADMIN'), (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Admin access granted.',
            user: req.user,
        });
    });
    // Global Error Handler
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
exports.default = exports.createApp;
