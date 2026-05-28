import type { NextApiRequest, NextApiResponse } from 'next';
import { countRecentUploads } from '@/lib/db';
import { UPLOAD_LIMITS } from '@/lib/limits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channelName } = req.query;
  const name = typeof channelName === 'string' && channelName.trim()
    ? channelName.trim()
    : 'Anonymous User';

  const videosUsed = await countRecentUploads(name, false);
  const shortsUsed = await countRecentUploads(name, true);

  return res.status(200).json({
    channelName: name,
    videos: {
      used: videosUsed,
      limit: UPLOAD_LIMITS.MAX_VIDEOS_PER_DAY,
      remaining: Math.max(0, UPLOAD_LIMITS.MAX_VIDEOS_PER_DAY - videosUsed),
    },
    shorts: {
      used: shortsUsed,
      limit: UPLOAD_LIMITS.MAX_SHORTS_PER_DAY,
      remaining: Math.max(0, UPLOAD_LIMITS.MAX_SHORTS_PER_DAY - shortsUsed),
    },
    limits: {
      maxVideoDurationSec: UPLOAD_LIMITS.MAX_VIDEO_DURATION_SEC,
      maxShortDurationSec: UPLOAD_LIMITS.MAX_SHORT_DURATION_SEC,
    },
  });
}
