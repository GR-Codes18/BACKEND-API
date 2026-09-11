import { Request, Response } from 'express';
import { z } from 'zod';
import { crearSolicitudSchema, responderSolicitudSchema } from '../schemas/solicitud.schema';
import * as solicitudService from '../services/solicitud.service';

export async function crearSolicitud(req: Request, res: Response) {
  const result = crearSolicitudSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      // Cambiamos .errors por .issues que es la propiedad nativa de Zod
      errors: (z as any).treeifyError ? (z as any).treeifyError(result.error) : result.error.issues,
    });
  }

  try {
    const solicitud = await solicitudService.crearSolicitud(result.data);
    
    return res.status(201).json({
      message: 'Solicitud enviada correctamente',
      solicitud,
    });
  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function listarSolicitudes(req: Request, res: Response) {
  try {
    const solicitudes = await solicitudService.listarSolicitudes();
    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error('Error en listarSolicitudes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function responderSolicitud(req: Request, res: Response) {
  // Aplicamos el cast explícito "as string" idéntico a tu auth.controller
  const id = req.params.id as string;
  const result = responderSolicitudSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: (z as any).treeifyError ? (z as any).treeifyError(result.error) : result.error.issues,
    });
  }

  try {
    const solicitudActualizada = await solicitudService.responderSolicitud(id, result.data.respuesta);
    
    return res.status(200).json({
      message: 'Respuesta enviada correctamente al cliente',
      solicitud: solicitudActualizada,
    });
  } catch (error: any) {
    console.error('Error en responderSolicitud:', error);
    
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    if (error.message === 'YA_RESPONDIDA') {
      return res.status(400).json({ message: 'Esta solicitud ya fue respondida' });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function editarRespuestaSolicitud(req: Request, res: Response) {
  // Aplicamos el cast explícito "as string"
  const id = req.params.id as string;
  const result = responderSolicitudSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: (z as any).treeifyError ? (z as any).treeifyError(result.error) : result.error.issues,
    });
  }

  try {
    const solicitudActualizada = await solicitudService.editarRespuestaSolicitud(id, result.data.respuesta);
    
    return res.status(200).json({
      message: 'Respuesta actualizada y reenviada correctamente al cliente',
      solicitud: solicitudActualizada,
    });
  } catch (error: any) {
    console.error('Error en editarRespuestaSolicitud:', error);
    
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    if (error.message === 'NO_RESPONDIDA_AUN') {
      return res.status(400).json({ message: 'No puedes editar una respuesta de una solicitud que aún no ha sido respondida' });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}