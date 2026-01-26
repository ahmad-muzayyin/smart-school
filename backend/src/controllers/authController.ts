import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
        // Basic validation
        return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    const { token, user } = await authService.login(email, password);

    res.status(200).json({
        status: 'success',
        token,
        data: { user },
    });
});

export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('Mohon isi password saat ini dan password baru', 400));
    }

    const token = await authService.updatePassword(req.user!.id, currentPassword, newPassword);

    res.status(200).json({
        status: 'success',
        token,
        message: 'Password berhasil diubah'
    });
});

