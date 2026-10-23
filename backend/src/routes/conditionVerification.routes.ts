import { Router } from 'express';
import { ConditionVerificationController } from '../controllers/conditionVerification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/condition-verification/pre-check - pre-check uploaded photo before publishing
router.post('/pre-check', authenticate, ConditionVerificationController.preCheckCondition);

// POST /api/condition-verification/:id - verify existing listing
router.post('/:id', authenticate, ConditionVerificationController.verifyListing);

// GET /api/condition-verification/:id - retrieve existing verification
router.get('/:id', authenticate, ConditionVerificationController.getListingVerification);

export default router;
