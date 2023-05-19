import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { message, reply } = req.body;
  const config = { message, reply };
  console.log(config);

  try {
    await writeFile('config.json', JSON.stringify(config, null, 2));
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Failed to write to file.' });
  }
}
