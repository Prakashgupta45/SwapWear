import { Router } from 'express';
import { AiRecommendationController } from '../controllers/aiRecommendation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/ai/recommendations - Personalized AI-boosted recommendations for authenticated user
router.get('/recommendations', authenticate, AiRecommendationController.getRecommendations);

export default router;
