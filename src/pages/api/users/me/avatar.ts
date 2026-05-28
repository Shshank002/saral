import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFileToS3, S3_BUCKET_AVATARS } from '@/lib/storage';

export const config = {
  api: { bodyParser: false },
};

const TEMP_DIR = path.join(os.tmpdir(), 'saral-avatars');

function ensureDir() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function safeUnlink(p?: string) {
  if (!p) return;
  try { fs.unlinkSync(p); } catch { /* ignore */ }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  ensureDir();

  const form = formidable({
    uploadDir: TEMP_DIR,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    filename: (name, ext) => `${uuidv4()}${ext}`,
  });

  let avatarPath: string | undefined;

  try {
    const [, files] = await form.parse(req);
    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    avatarPath = avatarFile?.filepath;

    if (!avatarFile) {
      return res.status(400).json({ error: 'Avatar file required' });
    }

    // Validate it's an image
    if (!avatarFile.mimetype?.startsWith('image/')) {
      safeUnlink(avatarPath);
      return res.status(400).json({ error: 'Only image files allowed' });
    }

    // Upload to MinIO/S3
    const ext = path.extname(avatarFile.originalFilename || '.jpg');
    const key = `${user.id}/${uuidv4()}${ext}`;
    const avatarUrl = await uploadFileToS3(avatarFile.filepath, S3_BUCKET_AVATARS, key);

    // Clean up temp file
    safeUnlink(avatarPath);

    // Update user in DB
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return res.status(200).json({
      success: true,
      avatarUrl: updated.avatarUrl,
    });
  } catch (err) {
    safeUnlink(avatarPath);
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Avatar upload failed' });
  }
}
