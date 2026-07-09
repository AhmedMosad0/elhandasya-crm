import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

export const authRouter = Router();
authRouter.post('/login', loginLimiter, authController.login);
authRouter.post('/signup', authController.signup);
authRouter.get('/me', verifyToken, authController.me);
