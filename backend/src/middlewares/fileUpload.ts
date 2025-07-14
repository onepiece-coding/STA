import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

export function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format'));
  }
}

export const photoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1024 * 1024 }, // 1 MB
});