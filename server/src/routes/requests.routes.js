import { Router } from 'express';
import { requestsController } from '../controllers/requests.controller.js';
import { requireRole } from '../middleware/rbac.middleware.js';

export const requestsRouter = Router();
requestsRouter.get('/', requestsController.list);
requestsRouter.get('/:id', requestsController.getById);
requestsRouter.post('/', requireRole('admin', 'sales', 'client'), requestsController.create);
requestsRouter.patch('/:id/approve', requireRole('admin'), requestsController.approve);
requestsRouter.patch('/:id/reject', requireRole('admin'), requestsController.reject);
requestsRouter.patch('/:id/assign-pricing', requireRole('sales', 'admin'), requestsController.assignPricing);
requestsRouter.patch('/:id/final-approve', requireRole('admin'), requestsController.finalApprove);
requestsRouter.patch('/:id/claim', requireRole('sales', 'admin'), requestsController.claim);
requestsRouter.patch('/:id/call-status', requireRole('sales', 'admin'), requestsController.callStatus);
requestsRouter.patch('/:id/admin-notes', requireRole('admin'), requestsController.updateAdminNotes);
requestsRouter.patch('/:id/claim-without-payment', requireRole('admin'), requestsController.setClaimWithoutPayment);
