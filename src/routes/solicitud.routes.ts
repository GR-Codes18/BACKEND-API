import { Router } from 'express';
import {
  crearSolicitud,
  listarSolicitudes,
  responderSolicitud,
  editarRespuestaSolicitud
} from '../controllers/solicitud.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/', crearSolicitud);

router.get('/', authMiddleware, requireRole('ANALISTA'), listarSolicitudes);
router.put('/:id/responder', authMiddleware, requireRole('ANALISTA'), responderSolicitud);
router.put('/:id/editar-respuesta', authMiddleware, requireRole('ANALISTA'), editarRespuestaSolicitud);

export default router;