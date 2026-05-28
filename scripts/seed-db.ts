// Database seed script for SARAL
//
// Run: npx tsx scripts/seed-db.ts
//   - Imports existing data/videos.json + data/comments.json (if present)
//   - Otherwise seeds with default sample data including shorts
//
// Idempotent: skips rows that already exist by ID

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface OldVideo {
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

interface OldComment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  createdAt: string;
}

// Convert duration string "MM:SS" or "HH:MM:SS" to seconds
function parseDuration(d?: string): number | null {
  if (!d) return null;
  const parts = d.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

async function main() {
  console.log('===== SARAL Database Seed =====\n');

  // Try to read existing JSON files
  const videosPath = path.join(process.cwd(), 'data', 'videos.json');
  const commentsPath = path.join(process.cwd(), 'data', 'comments.json');

  let oldVideos: OldVideo[] = [];
  let oldComments: OldComment[] = [];

  if (fs.existsSync(videosPath)) {
    try {
      oldVideos = JSON.parse(fs.readFileSync(videosPath, 'utf-8'));
      console.log(`Found ${oldVideos.length} videos in data/videos.json`);
    } catch (err) {
      console.warn('Could not parse videos.json:', err);
    }
  }

  if (fs.existsSync(commentsPath)) {
    try {
      oldComments = JSON.parse(fs.readFileSync(commentsPath, 'utf-8'));
      console.log(`Found ${oldComments.length} comments in data/comments.json`);
    } catch (err) {
      console.warn('Could not parse comments.json:', err);
    }
  }

  // If no data found, use defaults
  if (oldVideos.length === 0) {
    console.log('No existing data found - using default sample data');
    oldVideos = getDefaultSampleVideos();
  }

  console.log('\n--- Importing users ---');
  const channelNames = Array.from(new Set(oldVideos.map(v => v.channelName).concat(oldComments.map(c => c.author))));
  const userMap = new Map<string, string>();

  for (const name of channelNames) {
    if (!name) continue;
    const user = await prisma.user.upsert({
      where: { channelName: name },
      update: {},
      create: { channelName: name },
    });
    userMap.set(name, user.id);
    console.log(`  - ${name}`);
  }

  console.log('\n--- Importing videos ---');
  let videosCreated = 0;
  let videosSkipped = 0;

  for (const v of oldVideos) {
    const existing = await prisma.video.findFirst({
      where: { OR: [{ id: v.id }, { videoUrl: v.videoUrl }] },
    });
    if (existing) {
      videosSkipped++;
      continue;
    }
    const userId = userMap.get(v.channelName);
    if (!userId) continue;

    await prisma.video.create({
      data: {
        id: v.id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        userId,
        viewsCount: v.views,
        likesCount: v.likes,
        uploadedAt: new Date(v.uploadedAt),
        durationSeconds: parseDuration(v.duration),
        isShort: v.isShort ?? false,
      },
    });
    videosCreated++;
    console.log(`  + ${v.title.slice(0, 50)}`);
  }

  console.log(`\n  Created: ${videosCreated}, Skipped: ${videosSkipped}`);

  console.log('\n--- Importing comments ---');
  let commentsCreated = 0;

  for (const c of oldComments) {
    const existing = await prisma.comment.findUnique({ where: { id: c.id } });
    if (existing) continue;

    const userId = userMap.get(c.author);
    if (!userId) continue;

    // Make sure the video exists
    const video = await prisma.video.findUnique({ where: { id: c.videoId } });
    if (!video) continue;

    await prisma.comment.create({
      data: {
        id: c.id,
        videoId: c.videoId,
        userId,
        text: c.text,
        createdAt: new Date(c.createdAt),
      },
    });
    commentsCreated++;
  }

  console.log(`  Created: ${commentsCreated}`);

  console.log('\n===== Seed Complete =====');
  console.log('Run: npx prisma studio   to view your data');
}

function getDefaultSampleVideos(): OldVideo[] {
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      title: 'SARAL Platform Introduction',
      description: 'Welcome to SARAL!',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
      channelName: 'SARAL Official',
      views: 12450,
      likes: 892,
      uploadedAt: new Date(now - 86400000 * 2).toISOString(),
      duration: '10:34',
    },
    {
      id: 'short-1',
      title: 'Amazing sunset timelapse #shorts',
      description: 'Quick 30 second sunset timelapse',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400',
      channelName: 'Travel India',
      views: 89234,
      likes: 12453,
      uploadedAt: new Date(now - 3600000 * 4).toISOString(),
      duration: '0:30',
      isShort: true,
    },
  ];
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
