"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
class ProfileController {
    /**
     * GET /api/profile
     */
    static async getProfile(req, res, next) {
        try {
            const profile = await profile_service_1.ProfileService.getProfile(req.user.id);
            res.status(200).json({ success: true, data: { profile } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/profile
     */
    static async updateProfile(req, res, next) {
        try {
            const profile = await profile_service_1.ProfileService.updateProfile(req.user.id, req.body);
            res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { profile } });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
