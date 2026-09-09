import { Router } from 'express';
import { register, verifyOtp, login, resendOtp, me , crearTrabajador} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);
router.get('/me', authMiddleware, me);
router.post('/crear-trabajador', authMiddleware, requireRole('ANALISTA'), crearTrabajador);

export default router;