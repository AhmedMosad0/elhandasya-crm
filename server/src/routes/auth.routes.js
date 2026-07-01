import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

export const authRouter = Router();
authRouter.post('/login', authController.login);
authRouter.post('/signup', authController.signup);
authRouter.get('/me', verifyToken, authController.me);
