import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function multerErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    // Errores propios de Multer (ej. archivo demasiado grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo supera el límite de 10 MB' });
    }
    return res.status(400).json({ message: `Error al subir el archivo: ${err.message}` });
  }

  if (err) {
    // Errores lanzados manualmente desde fileFilter (como el de "Solo se permiten CSV")
    return res.status(400).json({ message: err.message });
  }

  next();
}