const myChatId = process.env.MY_CHAT_ID;
const token = process.env.TELEGRAM_BOT_TOKEN;

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
    // const replyMessagePromise = sendTelegramMessage(chatId, msg);
    // const okMessagePromise = sendTelegramMessage(message.chat.id, '回复成功！');
    // await Promise.all([replyMessagePromise, okMessagePromise]);
    await sendTelegramMessage(message.chat.id, '回复成功！');

    return res.status(200).send({});
  }
  else if (message) {    // 普通用户发来的消息
    // 转发用户原消息给管理员
    const forwardResult = await forwardTelegramMessage(myChatId, message.chat.id, message.message_id);
    
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
    
    await sendTelegramMessage(message.chat.id, '已收到您的消息，我们将尽快回复您！');

    return res.status(200).send({});
  } else {
    res.status(200).send({});
  }

  // Respond to the webhook request
  res.status(200).send({});
}

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
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

async function forwardTelegramMessage(chatId, fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${token}/forwardMessage`;

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
      console.error(`Failed to forward message: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to forward message: ${error.message}`);
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

// export default async (req, res) => {
//   const tgbot = '5975588613:AAFlmhxm_XRZ4RhqLOnfK7StJVbkJ7fINZk';

//   if (req.body.message.text === '/start') {
//     const message =
//       'Welcome to <i>NextJS News Channel</i> <b>' +
//       req.body.message.from.first_name +
//       '</b>.%0ATo get a list of commands sends /help';
//     const ret = await fetch(
//       `https://api.telegram.org/bot${tgbot}/sendMessage?chat_id=${req.body.message.chat.id}&text=${message}&parse_mode=HTML`
//     );
//   }
//   if (req.body.message.text === '/help') {
//     const message =
//       'Help for <i>NextJS News Channel</i>.%0AUse /search <i>keyword</i> to search for <i>keyword</i> in my Medium publication';
//     const ret = await fetch(
//       `https://api.telegram.org/bot${tgbot}/sendMessage?chat_id=${req.body.message.chat.id}&text=${message}&parse_mode=HTML`
//     );
//   }
//   else {
//     const message = req.body.message.text;
//     const ret = await fetch(
//       `https://api.telegram.org/bot${tgbot}/sendMessage?chat_id=${req.body.message.chat.id}&text=${message}&parse_mode=HTML`
//     );
//   }
//   res.status(200).send('OK');
// };

// // Create a bot that uses 'polling' to fetch new updates
// const bot = new TelegramBot(token, {polling: false });

// // Create a bot that uses 'webhook' to fetch new updates
// // const bot = new TelegramBot(token, {webHook: {port: process.env.PORT, host: process.env.HOST}});

// // This informs the Telegram servers of the new webhook.
// // bot.setWebHook(`${process.env.URL}/bot${token}`);

//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"

//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chatId, resp);
// });

