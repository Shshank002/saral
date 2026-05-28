import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { addVideo, countRecentUploads } from '@/lib/db';
import { UPLOAD_LIMITS, formatDuration } from '@/lib/limits';
import {
  uploadFileToS3,
  deleteFromS3,
  S3_BUCKET_VIDEOS,
  S3_BUCKET_THUMBNAILS,
} from '@/lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Use OS temp dir for incoming uploads - they go to S3/MinIO after validation
const TEMP_DIR = path.join(os.tmpdir(), 'saral-uploads');

function ensureTempDir() {
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  ensureTempDir();

  const form = formidable({
    uploadDir: TEMP_DIR,
    keepExtensions: true,
    maxFileSize: 500 * 1024 * 1024,
    filename: (name, ext) => `${uuidv4()}${ext}`,
  });

  let videoFilePath: string | undefined;
  let thumbnailFilePath: string | undefined;

  try {
    const [fields, files] = await form.parse(req);

    const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
    const thumbnailFile = Array.isArray(files.thumbnail)
      ? files.thumbnail[0]
      : files.thumbnail;

    videoFilePath = videoFile?.filepath;
    thumbnailFilePath = thumbnailFile?.filepath;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file required' });
    }

    const getField = (key: string) =>
      Array.isArray(fields[key]) ? (fields[key] as string[])[0] : (fields[key] as string | undefined);

    const title = getField('title') || 'Untitled';
    const description = getField('description') || '';
    const channelName = getField('channelName') || 'Anonymous User';
    const isShort = getField('isShort') === 'true';
    const durationSec = parseFloat(getField('durationSec') || '0');

    // === Validation 1: Duration limit ===
    if (durationSec > 0) {
      const maxDuration = isShort
        ? UPLOAD_LIMITS.MAX_SHORT_DURATION_SEC
        : UPLOAD_LIMITS.MAX_VIDEO_DURATION_SEC;

      if (durationSec > maxDuration) {
        safeUnlink(videoFilePath);
        safeUnlink(thumbnailFilePath);

        const limitLabel = isShort
          ? `${UPLOAD_LIMITS.MAX_SHORT_DURATION_SEC} seconds`
          : `${UPLOAD_LIMITS.MAX_VIDEO_DURATION_SEC / 3600} hours`;

        return res.status(400).json({
          error: `${isShort ? 'Short' : 'Video'} is too long. Maximum allowed: ${limitLabel}. Your file: ${formatDuration(durationSec)}`,
          code: 'DURATION_EXCEEDED',
        });
      }
    }

    // === Validation 2: Daily upload limit per channel ===
    const recentCount = await countRecentUploads(channelName, isShort);
    const dailyLimit = isShort
      ? UPLOAD_LIMITS.MAX_SHORTS_PER_DAY
      : UPLOAD_LIMITS.MAX_VIDEOS_PER_DAY;

    if (recentCount >= dailyLimit) {
      safeUnlink(videoFilePath);
      safeUnlink(thumbnailFilePath);

      const type = isShort ? 'shorts' : 'videos';
      return res.status(429).json({
        error: `Daily upload limit reached. You can upload ${dailyLimit} ${type} per 24 hours. You have already uploaded ${recentCount}.`,
        code: 'DAILY_LIMIT_EXCEEDED',
        used: recentCount,
        limit: dailyLimit,
      });
    }

    // === Upload video to S3/MinIO ===
    const videoExt = path.extname(videoFile.originalFilename || videoFile.filepath) || '.mp4';
    const videoKey = `${uuidv4()}${videoExt}`;
    const videoUrl = await uploadFileToS3(
      videoFile.filepath,
      S3_BUCKET_VIDEOS,
      videoKey
    );

    // Remove temp file after successful upload
    safeUnlink(videoFilePath);

    // === Upload thumbnail if provided ===
    let thumbnailUrl = `https://placehold.co/600x340/272727/FFFFFF?text=${encodeURIComponent(title.slice(0, 20))}`;
    if (thumbnailFile) {
      const thumbExt = path.extname(thumbnailFile.originalFilename || '.jpg');
      const thumbKey = `${uuidv4()}${thumbExt}`;
      thumbnailUrl = await uploadFileToS3(
        thumbnailFile.filepath,
        S3_BUCKET_THUMBNAILS,
        thumbKey
      );
      safeUnlink(thumbnailFilePath);
    }

    // === Save metadata to PostgreSQL ===
    const newVideo = await addVideo({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      channelName,
      isShort,
      durationSeconds: durationSec > 0 ? Math.round(durationSec) : undefined,
    });

    return res.status(200).json({ success: true, video: newVideo });
  } catch (err) {
    // Clean up temp files on any error
    safeUnlink(videoFilePath);
    safeUnlink(thumbnailFilePath);
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed', detail: String(err) });
  }
}
