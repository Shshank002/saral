import type { NextApiRequest, NextApiResponse } from 'next';
import { signup, setSessionCookie, validateSignupInput, AuthError } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, channelName } = req.body || {};

  // Validate inputs
  const validationError = validateSignupInput(email, password, channelName);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const { user, token } = await signup({
      email: email.toLowerCase().trim(),
      password,
      channelName: channelName.trim(),
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
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
}
