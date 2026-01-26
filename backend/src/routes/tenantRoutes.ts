import express from 'express';
import * as tenantController from '../controllers/tenantController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);
router.use(restrictTo(Role.OWNER));

router.route('/')
    .get(tenantController.getAllTenants)
    .post(tenantController.createTenant);

router.get('/statistics', tenantController.getTenantStatistics);

router.route('/:id')
    .get(tenantController.getTenant)
    .put(tenantController.updateTenant);

export default router;
