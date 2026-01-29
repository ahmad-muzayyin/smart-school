import express from 'express';
import * as classController from '../controllers/classController';
import * as classImportController from '../controllers/classImportController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { Role } from '@prisma/client';

import { upload } from '../utils/multer';

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.route('/')
    .get(restrictTo(Role.SCHOOL_ADMIN, Role.TEACHER), classController.getClasses)
    .post(restrictTo(Role.SCHOOL_ADMIN), classController.createClass);

router.post('/import-classes', restrictTo(Role.SCHOOL_ADMIN, Role.OWNER), upload.single('file'), classImportController.importClasses);
router.post('/import-schedules', restrictTo(Role.SCHOOL_ADMIN, Role.OWNER), upload.single('file'), classController.importSchedules);
router.get('/export-schedules', restrictTo(Role.SCHOOL_ADMIN, Role.OWNER), classController.exportSchedules);


router.route('/schedules')
    .post(restrictTo(Role.SCHOOL_ADMIN), classController.createSchedule)
    .get(classController.getTodaySchedule); // Accessible by Teacher, Student, Admin


router.route('/schedules/:id')
    .get(classController.getScheduleById) // Accessible by all authenticated users
    .put(restrictTo(Role.SCHOOL_ADMIN), classController.updateSchedule)
    .delete(restrictTo(Role.SCHOOL_ADMIN), classController.deleteSchedule);

router.route('/:id')
    .get(restrictTo(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT), classController.getClassById)
    .put(restrictTo(Role.SCHOOL_ADMIN), classController.updateClass)
    .delete(restrictTo(Role.SCHOOL_ADMIN), classController.deleteClass);

router.get('/:id/export-rekap', restrictTo(Role.SCHOOL_ADMIN, Role.TEACHER, Role.OWNER), classController.exportRecap);

export default router;
