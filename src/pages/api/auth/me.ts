import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';

// GET /api/auth/me - returns current logged-in user or null
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(200).json({ user: null });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      channelName: user.channelName,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      isVerified: user.isVerified,
    },
  });
}
