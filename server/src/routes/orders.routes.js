import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller.js';
import { requireRole } from '../middleware/rbac.middleware.js';

export const ordersRouter = Router();
ordersRouter.get('/', ordersController.list);
ordersRouter.get('/:id', ordersController.getById);
ordersRouter.post('/', requireRole('admin', 'sales', 'client'), ordersController.create);
ordersRouter.patch('/:id/assign', requireRole('admin'), ordersController.assign);
ordersRouter.patch('/:id/status', requireRole('admin', 'sales'), ordersController.updateStatus);
ordersRouter.post('/:id/payments', requireRole('admin', 'sales'), ordersController.addPayment);
