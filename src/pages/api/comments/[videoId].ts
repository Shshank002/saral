import type { NextApiRequest, NextApiResponse } from 'next';
import { getCommentsByVideoId, addComment } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { videoId } = req.query;
  if (typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Invalid videoId' });
  }

  if (req.method === 'GET') {
    const comments = await getCommentsByVideoId(videoId);
    return res.status(200).json({ comments });
  }

  if (req.method === 'POST') {
    const { author, text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }
    try {
      const newComment = await addComment({
        videoId,
        author: author || 'Guest',
        text: text.trim(),
      });
      return res.status(200).json({ comment: newComment });
    } catch (err) {
      console.error('Comment error:', err);
      return res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
