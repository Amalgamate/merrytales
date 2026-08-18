import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'node:fs/promises';
import crypto from 'crypto';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { AssetKind } from '@prisma/client';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

const uploadRoot = path.resolve(process.cwd(), 'apps/api/uploads');

// Use memory storage so we can inspect magic bytes before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac',
  'application/pdf',
]);

const MIME_TO_KIND: Record<string, AssetKind> = {
  'image/jpeg': AssetKind.IMAGE, 'image/png': AssetKind.IMAGE, 'image/gif': AssetKind.IMAGE,
  'image/webp': AssetKind.IMAGE, 'image/avif': AssetKind.IMAGE, 'image/svg+xml': AssetKind.IMAGE,
  'video/mp4': AssetKind.VIDEO, 'video/webm': AssetKind.VIDEO, 'video/quicktime': AssetKind.VIDEO,
  'audio/mpeg': AssetKind.AUDIO, 'audio/wav': AssetKind.AUDIO, 'audio/ogg': AssetKind.AUDIO, 'audio/aac': AssetKind.AUDIO,
  'application/pdf': AssetKind.DOCUMENT,
};

const router = Router();
router.use(requireAuth);

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'Choose a file to upload.' } });
    }

    // Validate MIME type using magic bytes from the file buffer
    const detected = await fileTypeFromBuffer(req.file.buffer);
    // Fall back to client-declared type only for formats magic-bytes can't detect (e.g. SVG, which is plain XML)
    const mimeType = detected?.mime ?? req.file.mimetype;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(415).json({
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: `File type ${mimeType} is not allowed. Upload images, video, audio or PDF files.`,
        },
      });
    }

    // Write validated file to disk
    const ext = path.extname(req.file.originalname).toLowerCase() || (detected?.ext ? `.${detected.ext}` : '');
    const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const filepath = path.join(uploadRoot, filename);

    await fs.mkdir(uploadRoot, { recursive: true });
    await fs.writeFile(filepath, req.file.buffer);

    const kind = MIME_TO_KIND[mimeType] ?? AssetKind.DOCUMENT;
    const asset = await db.asset.create({
      data: {
        ownerId: req.user!.id,
        kind,
        key: filename,
        url: `/uploads/${filename}`,
        mimeType,
        size: req.file.size,
      },
    });

    return res.status(201).json({ data: asset });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    return res.json({
      data: await db.asset.findMany({
        where: { ownerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      }),
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadsRouter, uploadRoot };
