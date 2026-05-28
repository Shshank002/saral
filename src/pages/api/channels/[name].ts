import type { NextApiRequest, NextApiResponse } from 'next';
import { getVideosByChannel } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;
  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid channel name' });
  }
  if (req.method === 'GET') {
    const videos = await getVideosByChannel(decodeURIComponent(name));
    return res.status(200).json({ videos });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
