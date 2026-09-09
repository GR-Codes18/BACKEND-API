import { Router } from 'express';
import { register, verifyOtp, login, resendOtp, me , crearTrabajador, aceptarSolicitud, rechazarSolicitud, estadoSolicitud } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);
router.get('/me', authMiddleware, me);
router.post('/crear-trabajador', authMiddleware, requireRole('ANALISTA'), crearTrabajador);
router.get('/login-requests/:id/aceptar', aceptarSolicitud);
router.get('/login-requests/:id/rechazar', rechazarSolicitud);
router.get('/login-requests/:id/estado', estadoSolicitud);

export default router;