// Object storage layer for SARAL
// Works with MinIO (local) AND AWS S3 (production) using the same code
// Switch by changing environment variables - no code changes needed!

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Read env vars
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || 'saral_minio_admin';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || 'saral_minio_password';
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

export const S3_BUCKET_VIDEOS = process.env.S3_BUCKET_VIDEOS || 'saral-videos';
export const S3_BUCKET_THUMBNAILS = process.env.S3_BUCKET_THUMBNAILS || 'saral-thumbnails';
export const S3_BUCKET_AVATARS = process.env.S3_BUCKET_AVATARS || 'saral-avatars';
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || 'http://localhost:9000';

// S3 client - same instance for MinIO and AWS S3
// For MinIO: endpoint = http://localhost:9000, forcePathStyle = true
// For AWS S3: endpoint = undefined, forcePathStyle = false
export const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT || undefined,
  forcePathStyle: S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

/**
 * Upload a file from local disk to S3/MinIO
 * Returns the public URL to access the file
 */
export async function uploadFileToS3(
  localFilePath: string,
  bucket: string,
  key: string,
  contentType?: string
): Promise<string> {
  const fileStream = fs.createReadStream(localFilePath);
  const stats = fs.statSync(localFilePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentLength: stats.size,
      ContentType: contentType || guessContentType(localFilePath),
    })
  );

  return buildPublicUrl(bucket, key);
}

/**
 * Build the public URL for a stored object
 * Works for both MinIO and AWS S3
 */
export function buildPublicUrl(bucket: string, key: string): string {
  if (S3_FORCE_PATH_STYLE) {
    // MinIO style: http://localhost:9000/bucket-name/key
    return `${S3_PUBLIC_URL}/${bucket}/${key}`;
  } else {
    // AWS S3 style: https://bucket-name.s3.region.amazonaws.com/key
    // OR custom S3_PUBLIC_URL set in env
    if (S3_PUBLIC_URL && !S3_PUBLIC_URL.includes('localhost')) {
      return `${S3_PUBLIC_URL}/${key}`;
    }
    return `https://${bucket}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }
}

/**
 * Delete a file from S3/MinIO
 * Used for cleanup when upload fails validation
 */
export async function deleteFromS3(bucket: string, key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key })
    );
  } catch (err) {
    console.error('Failed to delete from S3:', err);
  }
}

/**
 * Extract S3 key from a public URL (for deletion purposes)
 */
export function extractKeyFromUrl(url: string, bucket: string): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return map[ext] || 'application/octet-stream';
}
