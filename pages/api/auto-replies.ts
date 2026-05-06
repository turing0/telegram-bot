import { promises as fs } from 'fs';
import path from 'path';
import { isConfigAuthenticated } from '../../utils/config-auth';

// 在 Vercel 上会自动导入 KV，本地开发时可选
let kv: any = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (e) {
  console.log('KV not available, using file system');
}

interface AutoReply {
  id: string;
  keyword: string;
  reply: string;
  matchType: 'exact' | 'contains';
}

const REPLIES_KEY = 'auto-replies:list';
const configPath = path.join(process.cwd(), 'config', 'auto-replies.json');

/**
 * 判断是否在 Vercel 环境
 * 
 * Vercel 会自动注入以下环境变量：
 * - VERCEL: '1'
 * - VERCEL_ENV: 'production' | 'preview' | 'development'
 * - KV_REST_API_URL: Vercel KV 的 API 地址
 * - KV_REST_API_TOKEN: Vercel KV 的认证令牌
 * 
 * 本地开发/自建服务器：这些变量都不存在
 */
function isVercelEnvironment(): boolean {
  // 方法1：检查 Vercel 标志环境变量（最可靠）
  if (process.env.VERCEL === '1') {
    return true;
  }
  // 方法2：检查 KV 相关环境变量
  // if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  //   return true;
  // }
  return false;
}

async function readReplies(): Promise<AutoReply[]> {
  try {
    if (isVercelEnvironment() && kv) {
      // Vercel 环境：使用 KV
      const data = await kv.get(REPLIES_KEY);
      console.log('[Vercel] Reading from KV');
      return (data as AutoReply[]) || [];
    } else {
      // 本地开发/自建服务器：使用文件系统
      const data = await fs.readFile(configPath, 'utf8');
      console.log('[Local/Server] Reading from file system');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read replies:', error);
    return [];
  }
}

async function writeReplies(replies: AutoReply[]): Promise<void> {
  try {
    if (isVercelEnvironment() && kv) {
      // Vercel 环境：使用 KV
      await kv.set(REPLIES_KEY, replies);
      console.log('[Vercel] Writing to KV');
    } else {
      // 本地开发/自建服务器：使用文件系统
      await fs.writeFile(configPath, JSON.stringify(replies, null, 2));
      console.log('[Local/Server] Writing to file system');
    }
  } catch (error) {
    console.error('Failed to write replies:', error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  if (!isConfigAuthenticated(req.headers.cookie)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const replies = await readReplies();
    res.status(200).json(replies);
  } else if (req.method === 'POST') {
    const { keyword, reply, matchType } = req.body;
    const replies = await readReplies();
    const newReply: AutoReply = {
      id: Date.now().toString(),
      keyword,
      reply,
      matchType: matchType || 'exact',
    };
    replies.push(newReply);
    await writeReplies(replies);
    res.status(201).json(newReply);
  } else if (req.method === 'PUT') {
    const { id, keyword, reply, matchType } = req.body;
    const replies = await readReplies();
    const index = replies.findIndex(r => r.id === id);
    if (index !== -1) {
      replies[index] = { id, keyword, reply, matchType: matchType || 'exact' };
      await writeReplies(replies);
      res.status(200).json(replies[index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.body || {};
    const replyId = id || req.query?.id;

    if (!replyId) {
      return res.status(400).json({ error: 'Missing id' });
    }

    const replies = await readReplies();
    const filtered = replies.filter(r => r.id !== replyId);
    await writeReplies(filtered);
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
