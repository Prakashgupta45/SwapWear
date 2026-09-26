import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validations/profile.validation';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// GET /api/profile
router.get('/', ProfileController.getProfile);

// PATCH /api/profile
router.patch('/', validate(updateProfileSchema), ProfileController.updateProfile);

export default router;
