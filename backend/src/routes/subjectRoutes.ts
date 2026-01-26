import { Router } from 'express';
import * as subjectController from '../controllers/subjectController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', restrictTo('OWNER', 'SCHOOL_ADMIN', 'TEACHER'), subjectController.getSubjects);
router.post('/', restrictTo('OWNER', 'SCHOOL_ADMIN'), subjectController.createSubject);
router.put('/:id', restrictTo('OWNER', 'SCHOOL_ADMIN'), subjectController.updateSubject);
router.delete('/:id', restrictTo('OWNER', 'SCHOOL_ADMIN'), subjectController.deleteSubject);
router.post('/sync', restrictTo('OWNER', 'SCHOOL_ADMIN'), subjectController.syncSubjects);

export default router;
