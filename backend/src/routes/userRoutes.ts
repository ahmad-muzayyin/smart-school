import express from 'express';
import * as userController from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { Role } from '@prisma/client';

import { upload } from '../utils/multer';

const router = express.Router();

router.use(protect);
router.use(requireTenant); // Ensure tenant context

// Public routes (accessible by all authenticated users)
router.get('/students/by-class/:classId', userController.getStudentsByClass);
router.put('/:id', userController.updateUser);

// Only School Admins (and Owner) can manage users
router.use(restrictTo(Role.SCHOOL_ADMIN, Role.OWNER));

router.post('/', userController.createUser);
router.post('/import', upload.single('file'), userController.importUsers);
router.get('/teachers', userController.getTeachers);
router.get('/students', userController.getStudents);
router.get('/export-students', userController.exportStudents);
router.get('/export-teachers', userController.exportTeachers);
router.get('/admins', userController.getAdmins);
router.delete('/:id', userController.deleteUser);

export default router;
