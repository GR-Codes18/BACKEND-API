import { Router } from 'express';
import { register, verifyOtp, login, resendOtp } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);

export default router;