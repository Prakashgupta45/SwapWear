"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swapRequest_controller_1 = require("../controllers/swapRequest.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const swapRequest_validation_1 = require("../validations/swapRequest.validation");
const router = (0, express_1.Router)();
// All swap request routes require authentication
router.use(auth_middleware_1.authenticate);
// POST /api/swap-requests
router.post('/', (0, validate_middleware_1.validate)(swapRequest_validation_1.createSwapRequestSchema), swapRequest_controller_1.SwapRequestController.createSwapRequest);
// GET /api/swap-requests/sent (must be before /:id)
router.get('/sent', swapRequest_controller_1.SwapRequestController.getSentRequests);
// GET /api/swap-requests/received (must be before /:id)
router.get('/received', swapRequest_controller_1.SwapRequestController.getReceivedRequests);
// GET /api/swap-requests/:id
router.get('/:id', swapRequest_controller_1.SwapRequestController.getSwapRequestById);
// PATCH /api/swap-requests/:id/accept
router.patch('/:id/accept', swapRequest_controller_1.SwapRequestController.acceptSwapRequest);
// PATCH /api/swap-requests/:id/reject
router.patch('/:id/reject', swapRequest_controller_1.SwapRequestController.rejectSwapRequest);
// PATCH /api/swap-requests/:id/cancel
router.patch('/:id/cancel', swapRequest_controller_1.SwapRequestController.cancelSwapRequest);
exports.default = router;
