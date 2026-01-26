import express from 'express';
import * as materialController from '../controllers/materialController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);
router.use(requireTenant);

// Teacher can manage materials
router.post('/', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), materialController.createMaterial);
router.get('/', materialController.getMaterials); // All can view
router.get('/:id', materialController.getMaterialById);
router.put('/:id', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), materialController.updateMaterial);
router.delete('/:id', restrictTo(Role.TEACHER, Role.SCHOOL_ADMIN), materialController.deleteMaterial);

export default router;
