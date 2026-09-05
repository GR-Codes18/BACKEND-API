import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un CSV nuevo a Cloudinary.
 * publicId lo genera Cloudinary automáticamente si no se lo pasamos.
 */
export async function subirCsv(buffer: Buffer, nombreArchivo: string) {
  const resultado = await new Promise<{ secure_url: string; public_id: string; bytes: number }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'csv_files',
          filename_override: nombreArchivo,
          use_filename: true,
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as any);
        }
      );
      uploadStream.end(buffer);
    }
  );

  return {
    urlArchivo: resultado.secure_url,
    publicId: resultado.public_id,
    tamanioBytes: resultado.bytes,
  };
}

/**
 * Reemplaza el archivo de un CSV ya existente, manteniendo el mismo public_id
 * (y por lo tanto, la misma URL pública).
 */
export async function reemplazarCsv(buffer: Buffer, publicId: string) {
  const resultado = await new Promise<{ secure_url: string; bytes: number }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as any);
        }
      );
      uploadStream.end(buffer);
    }
  );

  return {
    urlArchivo: resultado.secure_url,
    tamanioBytes: resultado.bytes,
  };
}

/**
 * Elimina un CSV de Cloudinary por su public_id.
 */
export async function eliminarCsv(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}