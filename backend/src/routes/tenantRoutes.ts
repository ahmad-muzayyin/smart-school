import express from 'express';
import * as tenantController from '../controllers/tenantController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { upload } from '../utils/multer';


const router = express.Router();

router.use(protect);
router.use(protect);

router.route('/')
    .get(restrictTo(Role.OWNER), tenantController.getAllTenants)
    .post(restrictTo(Role.OWNER), tenantController.createTenant);

router.get('/statistics', restrictTo(Role.OWNER), tenantController.getTenantStatistics);

router.route('/:id')
    .get(tenantController.getTenant) // Authenticated users can view tenant details (for PDF headers)
    .patch(restrictTo(Role.OWNER, Role.SCHOOL_ADMIN), upload.single('logo'), tenantController.updateTenant)
    .put(restrictTo(Role.OWNER, Role.SCHOOL_ADMIN), upload.single('logo'), tenantController.updateTenant);

export default router;
