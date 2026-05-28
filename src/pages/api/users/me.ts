import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PUT /api/users/me - update profile (displayName, bio)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'PUT') {
    const { displayName, bio } = req.body || {};

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName !== undefined ? (displayName || null) : undefined,
        bio: bio !== undefined ? (bio || null) : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        channelName: updated.channelName,
        displayName: updated.displayName,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
