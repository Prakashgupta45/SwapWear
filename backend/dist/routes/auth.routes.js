"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.AuthController.register);
// POST /api/auth/login
router.post('/login', (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.AuthController.login);
// POST /api/auth/logout
router.post('/logout', auth_controller_1.AuthController.logout);
// GET /api/auth/me
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.me);
exports.default = router;
