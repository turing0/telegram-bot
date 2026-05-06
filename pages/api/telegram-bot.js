const myChatId = process.env.MY_CHAT_ID;
const topicGroupChatId = process.env.TOPIC_GROUP_CHAT_ID || null;
const token = process.env.TELEGRAM_BOT_TOKEN;

// 在 Vercel 上会自动导入 KV，本地开发时可选
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (e) {
  console.log('KV not available, using file system');
}

const fs = require('fs');
const path = require('path');
const configPath = path.join(process.cwd(), 'config', 'auto-replies.json');
const REPLIES_KEY = 'auto-replies:list';
const TOPIC_MAP_KEY = 'telegram:user-topic-map';
const topicMapPath = path.join(process.cwd(), 'config', 'user-topic-map.json');

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
function isVercelEnvironment() {
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

async function loadAutoReplies() {
  try {
    if (isVercelEnvironment() && kv) {
      // Vercel 环境：使用 KV
      const data = await kv.get(REPLIES_KEY);
      console.log('[Vercel] Loading auto replies from KV');
      return data || [];
    } else {
      // 本地开发/自建服务器：使用文件系统
      try {
        const data = fs.readFileSync(configPath, 'utf8');
        console.log('[Local/Server] Loading auto replies from file system');
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
  } catch (error) {
    console.error('Failed to load auto replies:', error);
    return [];
  }
}
async function getSavedTopicId(userChatId) {
  const key = String(userChatId);

  try {
    if (isVercelEnvironment() && kv) {
      return await kv.hget(TOPIC_MAP_KEY, key);
    }

    try {
      const data = fs.readFileSync(topicMapPath, 'utf8');
      const map = JSON.parse(data);
      return map[key] || null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Failed to get saved topic id:', error);
    return null;
  }
}

async function saveTopicId(userChatId, messageThreadId) {
  const key = String(userChatId);
  const value = String(messageThreadId);

  try {
    if (isVercelEnvironment() && kv) {
      await kv.hset(TOPIC_MAP_KEY, {
        [key]: value,
      });
      return;
    }

    let map = {};
    try {
      const data = fs.readFileSync(topicMapPath, 'utf8');
      map = JSON.parse(data);
    } catch {
      map = {};
    }

    map[key] = value;

    fs.mkdirSync(path.dirname(topicMapPath), { recursive: true });
    fs.writeFileSync(topicMapPath, JSON.stringify(map, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save topic id:', error);
  }
}

function checkAutoReplyMatch(text, autoReplies) {
  for (const reply of autoReplies) {
    if (reply.matchType === 'exact') {
      // 完全匹配
      if (text.toLowerCase() === reply.keyword.toLowerCase()) {
        return reply;
      }
    } else if (reply.matchType === 'contains') {
      // 关键词包含
      if (text.toLowerCase().includes(reply.keyword.toLowerCase())) {
        return reply;
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({
      error: 'We only support POST requests',
    });
  }

  // verify secret token
  const secretToken = req.query.token;
  if (secretToken !== token) {
    console.warn('Received unauthorized request');
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const { message } = req.body;
  if (!message) {
    // console.log('Ignored non-message update:', req.body);
    return res.status(200).send({});
  }
  const text = message.text || message.caption || '';
  const username = message.from?.username ? `@${message.from.username}` : '无username';
  const isAdminChat = String(message.chat.id) === String(myChatId);

  if (message.text === '/start') {   
    const welcomeMsg =
      `Welcome to <i>NextJS News Channel</i>, <b>${message.from.first_name}</b>.\nTo get a list of commands, send /help`;
    await sendTelegramMessage(message.chat.id, welcomeMsg);
    return res.status(200).send({});
  }
  else if (isAdminChat && message.reply_to_message) {  // 管理员聊天里的 reply，才当成“管理员回复用户”
    let targetChatId = null;
    const repliedText =
        message.reply_to_message.text ||
        message.reply_to_message.caption ||
        '';
    
    // 情况 1：管理员回复的是 Message from user xxx: 这条提示消息
    const match = repliedText.match(/^Message from user (\d+):/);
    if (match) {
      // chatId = parseInt(match[1]);
      // msg = escapeHtml(text);
      targetChatId = match[1];
    }
    // 情况 2：管理员直接回复被转发过来的消息
    if (!targetChatId) {
      targetChatId = getForwardOriginSenderUserId(message.reply_to_message);
    }
    if (targetChatId) {
      if (text) {
        await sendTelegramMessage(targetChatId, escapeHtml(text));
      } else {
        // 管理员回复的是贴纸、图片、语音、文件等
        await copyTelegramMessage(
          targetChatId,
          message.chat.id,
          message.message_id
        );
      }
    }
    // await sendTelegramMessage(message.chat.id, '回复成功！');

    return res.status(200).send({});
  }
  else if (message) {    // 普通用户发来的消息
    const autoReplies = await loadAutoReplies();
    const matchedReply = checkAutoReplyMatch(text, autoReplies);

    if (matchedReply) {
      // 自动回复
      await sendTelegramMessage(message.chat.id, matchedReply.reply);
      return res.status(200).send({});
    }

    // 创建topic（如果配置了 topicGroupChatId，并且用户消息不是来自 topicGroupChatId）
    let userTopicId = null;
    if (topicGroupChatId && String(message.chat.id) !== String(topicGroupChatId)) {
      userTopicId = await getOrCreateUserTopicId(message.chat.id, message.from);
    }

    // 转发用户原消息
    if (userTopicId) {
      await forwardTelegramMessage(topicGroupChatId, message.chat.id, message.message_id, userTopicId);
    } else {
      await forwardTelegramMessage(myChatId, message.chat.id, message.message_id);
    }
    // const forwardResult = await forwardTelegramMessage(myChatId, message.chat.id, message.message_id);
    
    if (!userTopicId) {
      const forwardedMessage = forwardResult?.result;
      const originUserId = getForwardOriginSenderUserId(forwardedMessage);
      const originalChatId = String(message.chat.id);
      const originMatchesOriginalUser = originUserId === originalChatId;
      // 如果 forward_origin.sender_user.id 没有，或者和原 chat.id 不一致，才补发消息来源
      if (!originMatchesOriginalUser) {
        const header =
          `Message from user ${message.chat.id}:↑\n` +
          `${escapeHtml(username)}\n` +
          `请回复这条消息来回复用户。`;
        await sendTelegramMessage(
          myChatId,
          header,
          forwardedMessage?.message_id
        );
      }
    }
    
    // await sendTelegramMessage(message.chat.id, '已收到您的消息，我们将尽快回复您！');

    return res.status(200).send({});
  } else {
    res.status(200).send({});
  }

  // Respond to the webhook request
  res.status(200).send({});
}

async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId;
    body.allow_sending_without_reply = true;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`Failed to send message to chat ${chatId}: ${data.description}`);
    }
    return data;
  } catch (error) {
    console.error(`Failed to send message to chat ${chatId}: ${error.message}`);
  }
}

async function forwardTelegramMessage(chatId, fromChatId, messageId, messageThreadId = null) {
  const url = `https://api.telegram.org/bot${token}/forwardMessage`;
  const body = {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  };
  if (messageThreadId) {
    body.message_thread_id = Number(messageThreadId);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error(`Failed to forward message: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to forward message: ${error.message}`);
  }
}

async function copyTelegramMessage(chatId, fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${token}/copyMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        from_chat_id: fromChatId,
        message_id: messageId,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error(`Failed to copy message: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to copy message: ${error.message}`);
  }
}

function makeTopicTitle(from, chatId) {
  const nickname = from?.first_name || '无昵称';
  const username = from?.username ? `@${from.username}` : '无username';
  let title = `${nickname}-${username}-${chatId}`;
  title = title.replace(/\s+/g, ' ').replace(/[\r\n]/g, ' ').trim();
  if (title.length > 128) {
    title = title.slice(0, 128);
  }
  return title;
}

async function getOrCreateUserTopicId(userChatId, from) {
  const savedTopicId = await getSavedTopicId(userChatId);

  if (savedTopicId) {
    console.log(`Use existing topic for user ${userChatId}:`, savedTopicId);
    return savedTopicId;
  }

  const topicTitle = makeTopicTitle(from, userChatId);
  const topicResult = await createForumTopic(topicGroupChatId, topicTitle);

  if (!topicResult?.message_thread_id) {
    console.error('Create topic failed or missing message_thread_id:', topicResult);
    return null;
  }

  const messageThreadId = topicResult.message_thread_id;

  await saveTopicId(userChatId, messageThreadId);

  console.log(`Created new topic for user ${userChatId}:`, messageThreadId);

  return messageThreadId;
}
async function createForumTopic(chatId, name) {
  const url = `https://api.telegram.org/bot${token}/createForumTopic`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        name,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Failed to create forum topic in chat ${chatId}: ${data.description}`);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error(`Failed to create forum topic: ${error.message}`);
    return null;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getForwardOriginSenderUserId(message) {
  const origin = message?.forward_origin;

  if (origin?.type === 'user' && origin.sender_user?.id) {
    return String(origin.sender_user.id);
  }

  return null;
}
