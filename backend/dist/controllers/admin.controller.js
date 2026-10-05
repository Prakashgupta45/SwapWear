"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("../services/admin.service");
class AdminController {
    /**
     * GET /api/admin/analytics
     */
    static async getAnalytics(_req, res, next) {
        try {
            const analytics = await admin_service_1.AdminService.getPlatformAnalytics();
            res.status(200).json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/users
     */
    static async getUsers(req, res, next) {
        try {
            const { page, limit, search, role } = req.query;
            const result = await admin_service_1.AdminService.getUsers({
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                search: search,
                role: role,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/users/:id
     */
    static async getUserById(req, res, next) {
        try {
            const user = await admin_service_1.AdminService.getUserById(req.params.id);
            res.status(200).json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/users/:id/role
     */
    static async updateUserRole(req, res, next) {
        try {
            const adminUserId = req.user.id;
            const targetUserId = req.params.id;
            const { role } = req.body;
            const user = await admin_service_1.AdminService.updateUserRole(adminUserId, targetUserId, role);
            res.status(200).json({
                success: true,
                message: `User role updated successfully to ${role}.`,
                data: { user },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/listings
     */
    static async getListings(req, res, next) {
        try {
            const { page, limit, search, category, condition, status } = req.query;
            const result = await admin_service_1.AdminService.getListings({
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                search: search,
                category: category,
                condition: condition,
                status: status,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/listings/:id
     */
    static async getListingById(req, res, next) {
        try {
            const listing = await admin_service_1.AdminService.getListingById(req.params.id);
            res.status(200).json({
                success: true,
                data: { listing },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/listings/:id/moderate
     */
    static async moderateListing(req, res, next) {
        try {
            const { action } = req.body;
            const result = await admin_service_1.AdminService.moderateListing(req.params.id, action);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.listing,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/swaps
     */
    static async getSwapRequests(req, res, next) {
        try {
            const { page, limit, status, search } = req.query;
            const result = await admin_service_1.AdminService.getSwapRequests({
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                status: status,
                search: search,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/swaps/:id
     */
    static async getSwapRequestById(req, res, next) {
        try {
            const swap = await admin_service_1.AdminService.getSwapRequestById(req.params.id);
            res.status(200).json({
                success: true,
                data: { swap },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/conversations
     */
    static async getConversations(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await admin_service_1.AdminService.getConversations({
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/conversations/:id
     */
    static async getConversationAudit(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await admin_service_1.AdminService.getConversationAudit(req.params.id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
