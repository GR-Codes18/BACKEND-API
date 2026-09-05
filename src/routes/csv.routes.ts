import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { crearCsv, listarCsv, limpiarCsv, eliminarCsvController } from '../controllers/csv.controller';
import { multerErrorHandler } from '../middlewares/multerError.middleware';

const router = Router();

router.post('/', authMiddleware, upload.single('file'), multerErrorHandler, crearCsv);
router.get('/', authMiddleware, listarCsv);
router.put('/:id/limpiar', authMiddleware, upload.single('file'), multerErrorHandler, limpiarCsv);
router.delete('/:id', authMiddleware, eliminarCsvController);


export default router;