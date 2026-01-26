import express from 'express';
import * as gradeController from '../controllers/gradeController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);
router.use(requireTenant);

// Teacher and Admin can manage grades
router.post('/', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), gradeController.createGrade);
router.get('/', gradeController.getGrades); // All authenticated users can view
router.get('/student/:studentId', gradeController.getGradesByStudent);
router.get('/class/:classId', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), gradeController.getGradesByClass);
router.get('/statistics/:classId', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), gradeController.getGradeStatistics);
router.put('/:id', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), gradeController.updateGrade);
router.delete('/:id', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), gradeController.deleteGrade);

export default router;
