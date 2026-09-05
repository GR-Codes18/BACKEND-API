import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { subirCsv, reemplazarCsv, eliminarCsv } from '../services/cloudinary.service';

export async function crearCsv(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const { filasCount, columnCount, tipo } = req.body;
    const userId = req.user!.userId;

    // Validamos que si viene 'tipo', debe ser un valor permitido
    const tiposValidos = ['PROPIO', 'OTRO'];
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: 'El campo tipo debe ser PROPIO u OTRO'});
    }

    const { urlArchivo, publicId, tamanioBytes } = await subirCsv(
      req.file.buffer,
      req.file.originalname
    );

    const csv = await prisma.csvFile.create({
      data: {
        nombre: req.file.originalname,
        tipo: tipo || 'PROPIO',
        urlArchivo,
        publicId,
        tamanioBytes,
        filasCount: filasCount ? Number(filasCount) : null,
        columnCount: columnCount ? Number(columnCount) : null,
        userId,
      },
    });

    return res.status(201).json({ message: 'CSV guardado correctamente', csv });
  } catch (error) {
    console.error('Error en crearCsv:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function listarCsv(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const [propios, otros] = await Promise.all([
      prisma.csvFile.findMany({
        where: { userId, tipo: 'PROPIO' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.csvFile.findMany({
        where: { userId, tipo: 'OTRO' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({ propios, otros });
  } catch (error) {
    console.error('Error en listarCsv:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function limpiarCsv(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const { id } = req.params as { id: string };
    const userId = req.user!.userId;
    const { filasCount, columnCount } = req.body;

    const csvExistente = await prisma.csvFile.findUnique({ where: { id } });

    if (!csvExistente || csvExistente.userId !== userId) {
      return res.status(404).json({ message: 'CSV no encontrado' });
    }

    const { urlArchivo, tamanioBytes } = await reemplazarCsv(
      req.file.buffer,
      csvExistente.publicId
    );

    const csvActualizado = await prisma.csvFile.update({
      where: { id },
      data: {
        estado: 'LIMPIO',
        urlArchivo,
        tamanioBytes,
        filasCount: filasCount ? Number(filasCount) : csvExistente.filasCount,
        columnCount: columnCount ? Number(columnCount) : csvExistente.columnCount,
      },
    });

    return res.status(200).json({ message: 'CSV actualizado a limpio', csv: csvActualizado });
  } catch (error) {
    console.error('Error en limpiarCsv:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function eliminarCsvController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.userId;

    const csvExistente = await prisma.csvFile.findUnique({ where: { id } });

    if (!csvExistente || csvExistente.userId !== userId) {
      return res.status(404).json({ message: 'CSV no encontrado' });
    }

    await eliminarCsv(csvExistente.publicId);
    await prisma.csvFile.delete({ where: { id } });

    return res.status(200).json({ message: 'CSV eliminado correctamente' });
  } catch (error) {
    console.error('Error en eliminarCsvController:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}