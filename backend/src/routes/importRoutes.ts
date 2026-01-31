import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { downloadImportTemplate, importSchedules } from '../controllers/importController';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // Memory storage is fine for parsing small excels

// Protect all routes
router.use(protect);
router.use(restrictTo('OWNER', 'SCHOOL_ADMIN', 'ADMIN_JADWAL')); // Customize roles

// GET /api/import/template?type=schedules
router.get('/template', downloadImportTemplate);

// POST /api/import/schedules
router.post('/schedules', upload.single('file'), importSchedules);

export default router;
