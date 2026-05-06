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
  const username = message.from?.username ? `@${message.from.username}` : '无用户名';

  if (message.text === '/start') {   
    const welcomeMsg =
      `Welcome to <i>NextJS News Channel</i>, <b>${message.from.first_name}</b>.\nTo get a list of commands, send /help`;
    await sendTelegramMessage(message.chat.id, welcomeMsg);
    return res.status(200).send({});
  }
  else if (message.reply_to_message) {  // 管理员回复用户 Forward the message
    const repliedText =
        message.reply_to_message.text ||
        message.reply_to_message.caption ||
        '';
    
    const match = repliedText.match(/^Message from user (\d+):/);
    let chatId = myChatId;
    let msg = 'Message from user ' + message.chat.id + ': ' + escapeHtml(text) + escapeHtml(username);
    if (match) {
      // chatId = parseInt(match[1]);
      // msg = escapeHtml(text);
      const targetChatId = match[1];
      // 管理员回复的是文字
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
  else if (message) {    // 普通用户发来的消息：先发一条说明给管理员
    // 转发用户原消息给管理员
    // const sendMessagePromise = sendTelegramMessage(myChatId, `Message from user ${message.chat.id}: ${message.text}\n@${message.from.username}`);
    const sendMessagePromise = forwardTelegramMessage(myChatId, message.chat.id, message.message_id);
    const receivedMessagePromise = sendTelegramMessage(message.chat.id, '已收到您的消息，我们将尽快回复您！');

    await Promise.all([sendMessagePromise, receivedMessagePromise]);
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

// // Matches "/echo [whatever]"
// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message

//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"

//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chatId, resp);
// });

