import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../types';
import { updateUserRoleSchema, moderateListingSchema } from '../validations/admin.validation';

const router = Router();

// Protect ALL admin routes with server-side authentication and ADMIN role verification
router.use(authenticate, authorizeRoles('ADMIN'));

// GET /api/admin/check
router.get('/check', (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted.',
    user: req.user,
  });
});

// GET /api/admin/analytics
router.get('/analytics', AdminController.getAnalytics);

// User Management routes
// GET /api/admin/users
router.get('/users', AdminController.getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', AdminController.getUserById);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', validate(updateUserRoleSchema), AdminController.updateUserRole);

// Clothing Listing Management & Moderation routes
// GET /api/admin/listings
router.get('/listings', AdminController.getListings);

// GET /api/admin/listings/:id
router.get('/listings/:id', AdminController.getListingById);

// PATCH /api/admin/listings/:id/moderate
router.patch('/listings/:id/moderate', validate(moderateListingSchema), AdminController.moderateListing);

// Swap Monitoring routes
// GET /api/admin/swaps
router.get('/swaps', AdminController.getSwapRequests);

// GET /api/admin/swaps/:id
router.get('/swaps/:id', AdminController.getSwapRequestById);

// Conversation Monitoring routes (privacy preserving)
// GET /api/admin/conversations
router.get('/conversations', AdminController.getConversations);

// GET /api/admin/conversations/:id
router.get('/conversations/:id', AdminController.getConversationAudit);

export default router;
