import type { NextApiRequest, NextApiResponse } from 'next';
import { getVideoById, incrementViews, incrementLikes } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'GET') {
    const video = await getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    return res.status(200).json({ video });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};
    if (action === 'view') {
      const v = await incrementViews(id);
      return res.status(200).json({ video: v });
    }
    if (action === 'like') {
      const v = await incrementLikes(id);
      return res.status(200).json({ video: v });
    }
    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
