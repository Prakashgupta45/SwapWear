import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), AuthController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/auth/me
router.get('/me', authenticate, AuthController.me);

export default router;
