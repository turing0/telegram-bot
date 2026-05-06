import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createConfigAuthCookie,
  isConfigPasswordSet,
  isValidConfigPassword,
} from '../../utils/config-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isConfigPasswordSet()) {
    return res.status(500).json({ error: 'CONFIG_PAGE_PASSWORD is not configured' });
  }

  const { password } = req.body || {};

  if (typeof password !== 'string' || !isValidConfigPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.setHeader('Set-Cookie', createConfigAuthCookie());
  return res.status(200).json({ success: true });
}
