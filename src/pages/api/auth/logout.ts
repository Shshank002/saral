import type { NextApiRequest, NextApiResponse } from 'next';
import { logout, getTokenFromRequest, clearSessionCookie } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTokenFromRequest(req);
  if (token) {
    await logout(token);
  }
  clearSessionCookie(res);

  return res.status(200).json({ success: true });
}
