"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const prisma_1 = require("../config/prisma");
const auth_service_1 = require("./auth.service");
const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    bio: true,
    city: true,
    state: true,
    pincode: true,
    createdAt: true,
    updatedAt: true,
};
class ProfileService {
    /**
     * Get the full profile of the currently authenticated user
     */
    static async getProfile(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: SAFE_USER_SELECT,
        });
        if (!user) {
            throw new auth_service_1.AppError('User not found.', 404);
        }
        return user;
    }
    /**
     * Update the profile of the currently authenticated user
     */
    static async updateProfile(userId, input) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.bio !== undefined && { bio: input.bio }),
                ...(input.city !== undefined && { city: input.city }),
                ...(input.state !== undefined && { state: input.state }),
                ...(input.pincode !== undefined && { pincode: input.pincode }),
            },
            select: SAFE_USER_SELECT,
        });
        return user;
    }
}
exports.ProfileService = ProfileService;
