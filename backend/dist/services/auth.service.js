"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.AppError = void 0;
const prisma_1 = require("../config/prisma");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
class AuthService {
    /**
     * Register a new user
     */
    static async register(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        // Check if email already registered
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            throw new AppError('An account with this email address already exists.', 409);
        }
        // Hash password securely with bcrypt
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        // Create user in database
        const user = await prisma_1.prisma.user.create({
            data: {
                name: input.name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: 'USER',
            },
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
        // Generate JWT token
        const token = (0, jwt_1.signJwt)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return { user, token };
    }
    /**
     * Authenticate user with email and password
     */
    static async login(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        // Find user by email
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            throw new AppError('Invalid email or password.', 401);
        }
        // Compare provided password with hashed password
        const isPasswordValid = await (0, password_1.comparePassword)(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password.', 401);
        }
        // Generate JWT token
        const token = (0, jwt_1.signJwt)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Return safe user without passwordHash
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return { user: safeUser, token };
    }
    /**
     * Retrieve safe user profile by ID
     */
    static async getSafeUser(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
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
            throw new AppError('User not found.', 404);
        }
        return user;
    }
}
exports.AuthService = AuthService;
