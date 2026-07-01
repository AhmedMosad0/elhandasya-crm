// Payments are a sub-resource of orders: POST /api/orders/:id/payments
// No standalone /api/payments routes needed.
import { Router } from 'express';
export const paymentsRouter = Router();
