import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRouter);

// Placeholder route files — to be wired in as they are implemented
// app.use('/api/auth', authRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/clients', clientsRouter);
// app.use('/api/requests', requestsRouter);
// app.use('/api/orders', ordersRouter);
// app.use('/api/payments', paymentsRouter);

export default app;
