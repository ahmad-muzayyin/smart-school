import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { globalErrorHandler } from './middlewares/errorMiddleware';
import { AppError } from './utils/AppError';

import authRoutes from './routes/authRoutes';
import tenantRoutes from './routes/tenantRoutes';
import userRoutes from './routes/userRoutes';
import classRoutes from './routes/classRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import subjectRoutes from './routes/subjectRoutes';
import gradeRoutes from './routes/gradeRoutes';
import materialRoutes from './routes/materialRoutes';
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes';
import journalRoutes from './routes/journalRoutes';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/journals', journalRoutes);

// 404
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
