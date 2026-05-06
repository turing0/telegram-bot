import { promises as fs } from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config', 'auto-replies.json');

interface AutoReply {
  id: string;
  keyword: string;
  reply: string;
}

async function readReplies(): Promise<AutoReply[]> {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeReplies(replies: AutoReply[]): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(replies, null, 2));
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const replies = await readReplies();
    res.status(200).json(replies);
  } else if (req.method === 'POST') {
    const { keyword, reply } = req.body;
    const replies = await readReplies();
    const newReply: AutoReply = {
      id: Date.now().toString(),
      keyword,
      reply,
    };
    replies.push(newReply);
    await writeReplies(replies);
    res.status(201).json(newReply);
  } else if (req.method === 'PUT') {
    const { id, keyword, reply } = req.body;
    const replies = await readReplies();
    const index = replies.findIndex(r => r.id === id);
    if (index !== -1) {
      replies[index] = { id, keyword, reply };
      await writeReplies(replies);
      res.status(200).json(replies[index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    const replies = await readReplies();
    const filtered = replies.filter(r => r.id !== id);
    await writeReplies(filtered);
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}