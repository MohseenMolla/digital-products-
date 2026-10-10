import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/AppError';

export const UPLOAD_RULES = {
  image: { mimes: ['image/jpeg', 'image/png', 'image/webp'], exts: ['.jpg', '.jpeg', '.png', '.webp'], maxBytes: 5 * 1024 * 1024 },
  pdf: { mimes: ['application/pdf'], exts: ['.pdf'], maxBytes: 50 * 1024 * 1024 },
  resource: {
    mimes: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
    exts: ['.pdf', '.zip', '.docx', '.xlsx', '.txt'],
    maxBytes: 50 * 1024 * 1024,
  },
} as const;
export type UploadKind = keyof typeof UPLOAD_RULES;

export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const kind = String(req.query.kind || 'image') as UploadKind;
    const rule = UPLOAD_RULES[kind];
    if (!rule) return cb(new AppError(400, 'Invalid upload kind', 'UPLOAD_ERROR'));
    const ext = path.extname(file.originalname).toLowerCase();
    if (!rule.mimes.includes(file.mimetype as never) || !rule.exts.includes(ext as never)) {
      return cb(new AppError(422, `File type not allowed for ${kind}`, 'UPLOAD_TYPE'));
    }
    cb(null, true);
  },
}).single('file');
