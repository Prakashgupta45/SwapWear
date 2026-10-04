"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const cookie_1 = require("../utils/cookie");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
async function authenticate(req, res, next) {
    try {
        let token;
        // 1. Check HTTP-only cookie first
        if (req.cookies && req.cookies[cookie_1.AUTH_COOKIE_NAME]) {
            token = req.cookies[cookie_1.AUTH_COOKIE_NAME];
        }
        // 2. Check Authorization Bearer header as secondary option (useful for testing/external clients)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.',
            });
            return;
        }
        // Verify token
        let decoded;
        try {
            decoded = (0, jwt_1.verifyJwt)(token);
        }
        catch {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token.',
            });
            return;
        }
        // Lookup user in database
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists.',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
