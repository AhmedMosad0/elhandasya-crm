import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { clientsRouter } from './routes/clients.routes.js';
import { requestsRouter } from './routes/requests.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { verifyToken } from './middleware/auth.middleware.js';
import { requireRole } from './middleware/rbac.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
});

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors({ origin: '*' }));
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, requireRole('admin'), usersRouter);
app.use('/api/clients', verifyToken, clientsRouter);
app.use('/api/requests', verifyToken, requestsRouter);
app.use('/api/orders', verifyToken, ordersRouter);

app.use(errorHandler);

export default app;
