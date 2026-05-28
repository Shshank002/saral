import type { NextApiRequest, NextApiResponse } from 'next';
import { getShorts } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const shorts = await getShorts();
    return res.status(200).json({ shorts });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
