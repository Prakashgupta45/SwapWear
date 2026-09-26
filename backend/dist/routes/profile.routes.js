"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const profile_validation_1 = require("../validations/profile.validation");
const router = (0, express_1.Router)();
// All profile routes require authentication
router.use(auth_middleware_1.authenticate);
// GET /api/profile
router.get('/', profile_controller_1.ProfileController.getProfile);
// PATCH /api/profile
router.patch('/', (0, validate_middleware_1.validate)(profile_validation_1.updateProfileSchema), profile_controller_1.ProfileController.updateProfile);
exports.default = router;
