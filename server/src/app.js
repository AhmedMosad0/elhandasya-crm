import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { clientsRouter } from './routes/clients.routes.js';
import { requestsRouter } from './routes/requests.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { verifyToken } from './middleware/auth.middleware.js';
import { requireRole } from './middleware/rbac.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, requireRole('admin'), usersRouter);
app.use('/api/clients', verifyToken, clientsRouter);
app.use('/api/requests', verifyToken, requestsRouter);
app.use('/api/orders', verifyToken, ordersRouter);

app.use(errorHandler);

export default app;
