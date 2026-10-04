"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const match_controller_1 = require("../controllers/match.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const match_validation_1 = require("../validations/match.validation");
const router = (0, express_1.Router)();
// GET /api/matches/recommendations - Personalized recommendations for logged-in user
router.get('/recommendations', auth_middleware_1.authenticate, match_controller_1.MatchController.getUserRecommendations);
// POST /api/matches/compare - Compare any two listings side-by-side
router.post('/compare', (0, validate_middleware_1.validate)(match_validation_1.compareListingsSchema), match_controller_1.MatchController.compareListings);
// GET /api/matches/listing/:id - Get matches for a listing
router.get('/listing/:id', match_controller_1.MatchController.getListingMatches);
exports.default = router;
