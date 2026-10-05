"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const admin_validation_1 = require("../validations/admin.validation");
const router = (0, express_1.Router)();
// Protect ALL admin routes with server-side authentication and ADMIN role verification
router.use(auth_middleware_1.authenticate, (0, authorize_middleware_1.authorizeRoles)('ADMIN'));
// GET /api/admin/check
router.get('/check', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin access granted.',
        user: req.user,
    });
});
// GET /api/admin/analytics
router.get('/analytics', admin_controller_1.AdminController.getAnalytics);
// User Management routes
// GET /api/admin/users
router.get('/users', admin_controller_1.AdminController.getUsers);
// GET /api/admin/users/:id
router.get('/users/:id', admin_controller_1.AdminController.getUserById);
// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', (0, validate_middleware_1.validate)(admin_validation_1.updateUserRoleSchema), admin_controller_1.AdminController.updateUserRole);
// Clothing Listing Management & Moderation routes
// GET /api/admin/listings
router.get('/listings', admin_controller_1.AdminController.getListings);
// GET /api/admin/listings/:id
router.get('/listings/:id', admin_controller_1.AdminController.getListingById);
// PATCH /api/admin/listings/:id/moderate
router.patch('/listings/:id/moderate', (0, validate_middleware_1.validate)(admin_validation_1.moderateListingSchema), admin_controller_1.AdminController.moderateListing);
// Swap Monitoring routes
// GET /api/admin/swaps
router.get('/swaps', admin_controller_1.AdminController.getSwapRequests);
// GET /api/admin/swaps/:id
router.get('/swaps/:id', admin_controller_1.AdminController.getSwapRequestById);
// Conversation Monitoring routes (privacy preserving)
// GET /api/admin/conversations
router.get('/conversations', admin_controller_1.AdminController.getConversations);
// GET /api/admin/conversations/:id
router.get('/conversations/:id', admin_controller_1.AdminController.getConversationAudit);
exports.default = router;
