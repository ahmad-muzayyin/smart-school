import express from 'express';
import * as authController from '../controllers/authController';

import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/login', authController.login);
router.post('/update-password', protect, authController.updatePassword);

export default router;
