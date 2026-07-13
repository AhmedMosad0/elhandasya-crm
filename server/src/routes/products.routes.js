import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { upload } from '../config/cloudinary.js';

export const productsRouter = Router();

// Public — clients and staff both need this without extra auth check
productsRouter.get('/',   productsController.list);
productsRouter.get('/:id', productsController.getById);

// Admin only
productsRouter.post('/',    verifyToken, requireRole('admin'), upload.single('image'), productsController.create);
productsRouter.put('/:id',  verifyToken, requireRole('admin'), upload.single('image'), productsController.update);
productsRouter.delete('/:id', verifyToken, requireRole('admin'), productsController.delete);
