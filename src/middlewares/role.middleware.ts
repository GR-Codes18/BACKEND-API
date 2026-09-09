import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(...rolesPermitidos: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
}