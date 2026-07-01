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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, requireRole('admin'), usersRouter);
app.use('/api/clients', verifyToken, clientsRouter);
app.use('/api/requests', verifyToken, requestsRouter);
app.use('/api/orders', verifyToken, ordersRouter);

app.use(errorHandler);

export default app;
