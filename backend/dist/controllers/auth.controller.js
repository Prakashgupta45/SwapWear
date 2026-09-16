"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const cookie_1 = require("../utils/cookie");
class AuthController {
    /**
     * POST /api/auth/register
     */
    static async register(req, res, next) {
        try {
            const { user, token } = await auth_service_1.AuthService.register(req.body);
            // Set secure HTTP-only cookie
            (0, cookie_1.setAuthCookie)(res, token);
            res.status(201).json({
                success: true,
                message: 'Registration successful.',
                data: { user, token },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/auth/login
     */
    static async login(req, res, next) {
        try {
            const { user, token } = await auth_service_1.AuthService.login(req.body);
            // Set secure HTTP-only cookie
            (0, cookie_1.setAuthCookie)(res, token);
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: { user, token },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/auth/logout
     */
    static async logout(_req, res, next) {
        try {
            // Clear secure HTTP-only cookie
            (0, cookie_1.clearAuthCookie)(res);
            res.status(200).json({
                success: true,
                message: 'Logged out successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/auth/me
     */
    static async me(req, res, next) {
        try {
            // req.user is populated by authenticate middleware
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated.',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { user: req.user },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
