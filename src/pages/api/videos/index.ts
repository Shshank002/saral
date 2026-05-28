import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllVideos, searchVideos, getRegularVideos } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { q, type } = req.query;
    let videos;
    if (q) {
      videos = await searchVideos(q as string);
    } else if (type === 'regular') {
      videos = await getRegularVideos();
    } else {
      videos = await getAllVideos();
    }
    return res.status(200).json({ videos });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
