import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { compareListingsSchema } from '../validations/match.validation';

const router = Router();

// GET /api/matches/recommendations - Personalized recommendations for logged-in user
router.get('/recommendations', authenticate, MatchController.getUserRecommendations);

// POST /api/matches/compare - Compare any two listings side-by-side
router.post('/compare', validate(compareListingsSchema), MatchController.compareListings);

// GET /api/matches/listing/:id - Get matches for a listing
router.get('/listing/:id', MatchController.getListingMatches);

export default router;
