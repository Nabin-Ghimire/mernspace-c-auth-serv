import express from 'express';
import 'reflect-metadata';

import authRouter from './routes/auth';
import tenantRouter from './routes/tenant';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { globalErrorHandler } from './middlewares/globalErrorHandler';

const app = express();

app.use(
    cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    }),
);
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to auth service');
});

app.use('/auth', authRouter);
app.use('/tenants', tenantRouter);
app.use('/users', userRouter);

app.use(globalErrorHandler);

export default app;
