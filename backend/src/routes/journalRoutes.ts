import express from 'express';
import * as journalController from '../controllers/journalController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
    .post(restrictTo('TEACHER', 'SCHOOL_ADMIN', 'OWNER'), journalController.createJournal)
    .get(journalController.getJournals);

router.route('/:id')
    .delete(restrictTo('SCHOOL_ADMIN', 'OWNER', 'TEACHER'), journalController.deleteJournal);

export default router;
