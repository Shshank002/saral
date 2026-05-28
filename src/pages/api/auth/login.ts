import type { NextApiRequest, NextApiResponse } from 'next';
import { login, setSessionCookie, AuthError } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { user, token } = await login({
      email: email.toLowerCase().trim(),
      password,
    });

    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        channelName: user.channelName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}
