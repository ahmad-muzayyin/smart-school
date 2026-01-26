import express from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.post('/', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), attendanceController.submitAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/export', attendanceController.exportAttendance);

export default router;
