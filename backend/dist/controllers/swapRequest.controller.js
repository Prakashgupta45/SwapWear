"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapRequestController = void 0;
const swapRequest_service_1 = require("../services/swapRequest.service");
class SwapRequestController {
    /**
     * POST /api/swap-requests
     * Create a swap request
     */
    static async createSwapRequest(req, res, next) {
        try {
            const swapRequest = await swapRequest_service_1.SwapRequestService.createSwapRequest(req.user.id, req.body);
            res.status(201).json({
                success: true,
                message: 'Swap request submitted successfully.',
                data: { swapRequest },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/swap-requests/sent
     * Retrieve swap requests sent by the authenticated user
     */
    static async getSentRequests(req, res, next) {
        try {
            const swapRequests = await swapRequest_service_1.SwapRequestService.getSentRequests(req.user.id);
            res.status(200).json({
                success: true,
                data: { swapRequests },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/swap-requests/received
     * Retrieve swap requests received by the authenticated user
     */
    static async getReceivedRequests(req, res, next) {
        try {
            const swapRequests = await swapRequest_service_1.SwapRequestService.getReceivedRequests(req.user.id);
            res.status(200).json({
                success: true,
                data: { swapRequests },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/swap-requests/:id
     * Retrieve detailed information for a specific swap request
     */
    static async getSwapRequestById(req, res, next) {
        try {
            const swapRequest = await swapRequest_service_1.SwapRequestService.getSwapRequestById(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                data: { swapRequest },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/swap-requests/:id/accept
     * Accept a swap request (recipient only)
     */
    static async acceptSwapRequest(req, res, next) {
        try {
            const swapRequest = await swapRequest_service_1.SwapRequestService.acceptSwapRequest(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Swap request accepted successfully. Both listings are now reserved.',
                data: { swapRequest },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/swap-requests/:id/reject
     * Reject a swap request (recipient only)
     */
    static async rejectSwapRequest(req, res, next) {
        try {
            const swapRequest = await swapRequest_service_1.SwapRequestService.rejectSwapRequest(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Swap request rejected.',
                data: { swapRequest },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/swap-requests/:id/cancel
     * Cancel a swap request (requester only)
     */
    static async cancelSwapRequest(req, res, next) {
        try {
            const swapRequest = await swapRequest_service_1.SwapRequestService.cancelSwapRequest(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Swap request cancelled.',
                data: { swapRequest },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SwapRequestController = SwapRequestController;
