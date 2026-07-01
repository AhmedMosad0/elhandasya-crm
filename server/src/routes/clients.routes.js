import { Router } from 'express';
import { clientsController } from '../controllers/clients.controller.js';
import { requireRole } from '../middleware/rbac.middleware.js';

export const clientsRouter = Router();
clientsRouter.get('/', clientsController.list);
clientsRouter.get('/:id', clientsController.getById);
clientsRouter.post('/', requireRole('admin', 'sales'), clientsController.create);
clientsRouter.put('/:id', requireRole('admin', 'sales'), clientsController.update);
clientsRouter.delete('/:id', requireRole('admin'), clientsController.delete);
