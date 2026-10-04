import { Router } from 'express';
import { SwapRequestController } from '../controllers/swapRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSwapRequestSchema } from '../validations/swapRequest.validation';

const router = Router();

// All swap request routes require authentication
router.use(authenticate);

// POST /api/swap-requests
router.post('/', validate(createSwapRequestSchema), SwapRequestController.createSwapRequest);

// GET /api/swap-requests/sent (must be before /:id)
router.get('/sent', SwapRequestController.getSentRequests);

// GET /api/swap-requests/received (must be before /:id)
router.get('/received', SwapRequestController.getReceivedRequests);

// GET /api/swap-requests/:id
router.get('/:id', SwapRequestController.getSwapRequestById);

// PATCH /api/swap-requests/:id/accept
router.patch('/:id/accept', SwapRequestController.acceptSwapRequest);

// PATCH /api/swap-requests/:id/reject
router.patch('/:id/reject', SwapRequestController.rejectSwapRequest);

// PATCH /api/swap-requests/:id/cancel
router.patch('/:id/cancel', SwapRequestController.cancelSwapRequest);

export default router;
