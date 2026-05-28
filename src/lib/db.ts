// Database layer for SARAL
// Now uses PostgreSQL via Prisma (was JSON files before)
// All API routes and pages use these same functions - no changes needed elsewhere

import { prisma } from './prisma';
import { formatDuration } from './limits';

// ===== Types =====
// These keep the SAME shape that the rest of the app expects
export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelName: string;
  views: number;
  likes: number;
  uploadedAt: string;
  duration?: string;
  isShort?: boolean;
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  createdAt: string;
}

// ===== Helpers to convert DB rows to app-shape =====
function dbVideoToApp(v: any): Video {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    channelName: v.user?.channelName || 'Unknown',
    views: v.viewsCount,
    likes: v.likesCount,
    uploadedAt: v.uploadedAt.toISOString(),
    duration: v.durationSeconds ? formatDuration(v.durationSeconds) : undefined,
    isShort: v.isShort,
  };
}

function dbCommentToApp(c: any): Comment {
  return {
    id: c.id,
    videoId: c.videoId,
    author: c.user?.channelName || 'Anonymous',
    text: c.text,
    createdAt: c.createdAt.toISOString(),
  };
}

// ===== Ensure a user (channel) exists - upsert by channelName =====
// In production, replace with real auth. For now, channelName is the identifier.
export async function getOrCreateUser(channelName: string) {
  return prisma.user.upsert({
    where: { channelName },
    update: {},
    create: { channelName },
  });
}

// ===== Video operations =====
export async function getAllVideos(): Promise<Video[]> {
  const videos = await prisma.video.findMany({
    include: { user: true },
    orderBy: { uploadedAt: 'desc' },
  });
  return videos.map(dbVideoToApp);
}

export async function getVideoById(id: string): Promise<Video | null> {
  const v = await prisma.video.findUnique({
    where: { id },
    include: { user: true },
  });
  return v ? dbVideoToApp(v) : null;
}

export async function addVideo(input: {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelName: string;
  isShort?: boolean;
  durationSeconds?: number;
}): Promise<Video> {
  const user = await getOrCreateUser(input.channelName);

  const created = await prisma.video.create({
    data: {
      title: input.title,
      description: input.description,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      userId: user.id,
      isShort: input.isShort ?? false,
      durationSeconds: input.durationSeconds ?? null,
    },
    include: { user: true },
  });

  return dbVideoToApp(created);
}

export async function incrementViews(id: string): Promise<Video | null> {
  try {
    const updated = await prisma.video.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
      include: { user: true },
    });
    return dbVideoToApp(updated);
  } catch {
    return null;
  }
}

export async function incrementLikes(id: string): Promise<Video | null> {
  try {
    const updated = await prisma.video.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
      include: { user: true },
    });
    return dbVideoToApp(updated);
  } catch {
    return null;
  }
}

export async function searchVideos(query: string): Promise<Video[]> {
  if (!query) return getAllVideos();
  const q = query.trim();
  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { user: { channelName: { contains: q, mode: 'insensitive' } } },
      ],
    },
    include: { user: true },
    orderBy: { uploadedAt: 'desc' },
  });
  return videos.map(dbVideoToApp);
}

export async function getVideosByChannel(channelName: string): Promise<Video[]> {
  const videos = await prisma.video.findMany({
    where: { user: { channelName: { equals: channelName, mode: 'insensitive' } } },
    include: { user: true },
    orderBy: { uploadedAt: 'desc' },
  });
  return videos.map(dbVideoToApp);
}

export async function getShorts(): Promise<Video[]> {
  const videos = await prisma.video.findMany({
    where: { isShort: true },
    include: { user: true },
    orderBy: { uploadedAt: 'desc' },
  });
  return videos.map(dbVideoToApp);
}

export async function getRegularVideos(): Promise<Video[]> {
  const videos = await prisma.video.findMany({
    where: { isShort: false },
    include: { user: true },
    orderBy: { uploadedAt: 'desc' },
  });
  return videos.map(dbVideoToApp);
}

// Count uploads in last 24h for a channel
export async function countRecentUploads(channelName: string, isShort: boolean): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.video.count({
    where: {
      user: { channelName: { equals: channelName, mode: 'insensitive' } },
      isShort,
      uploadedAt: { gte: dayAgo },
    },
  });
}

// ===== Comment operations =====
export async function getCommentsByVideoId(videoId: string): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: { videoId, parentId: null },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return comments.map(dbCommentToApp);
}

export async function addComment(input: {
  videoId: string;
  author: string;
  text: string;
}): Promise<Comment> {
  const user = await getOrCreateUser(input.author || 'Anonymous');
  const created = await prisma.comment.create({
    data: {
      videoId: input.videoId,
      userId: user.id,
      text: input.text,
    },
    include: { user: true },
  });
  return dbCommentToApp(created);
}

// ===== Backward compatibility =====
// seedSampleData is no longer needed - use the migration script instead.
// Keep as no-op so existing API routes don't break.
export function seedSampleData() {
  // Sample data is loaded via: npm run db:seed
  // See scripts/migrate-json-to-db.ts
}
