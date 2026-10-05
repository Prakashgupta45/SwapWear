"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiRecommendation_controller_1 = require("../controllers/aiRecommendation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/ai/recommendations - Personalized AI-boosted recommendations for authenticated user
router.get('/recommendations', auth_middleware_1.authenticate, aiRecommendation_controller_1.AiRecommendationController.getRecommendations);
exports.default = router;
