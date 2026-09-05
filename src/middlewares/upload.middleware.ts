import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo, por ahora 
  },
  fileFilter: (req, file, cb) => {
    const esCsv = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    if (!esCsv) {
      return cb(new Error('Solo se permiten archivos CSV'));
    }
    cb(null, true);
  },
});