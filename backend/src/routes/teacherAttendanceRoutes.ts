import express from 'express';
import * as teacherAttendanceController from '../controllers/teacherAttendanceController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/check-in', restrictTo('TEACHER', 'SCHOOL_ADMIN', 'OWNER'), teacherAttendanceController.checkIn);
router.post('/check-out', restrictTo('TEACHER', 'SCHOOL_ADMIN', 'OWNER'), teacherAttendanceController.checkOut);
router.get('/history', restrictTo('TEACHER', 'SCHOOL_ADMIN', 'OWNER'), teacherAttendanceController.getHistory);
router.get('/today', restrictTo('TEACHER', 'SCHOOL_ADMIN', 'OWNER'), teacherAttendanceController.getTodayStatus);

export default router;
