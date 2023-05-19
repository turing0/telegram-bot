// const myChatId = '5525041552'
// const token = '5975588613:AAFlmhxm_XRZ4RhqLOnfK7StJVbkJ7fINZk'

const myChatId = process.env.MY_CHAT_ID;
const token = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // // 检查 token 是否匹配
    // const token = update.message?.text?.split(' ')[1];
    // if (token !== token) {
    //   console.warn('Received unauthorized request');
    //   return;
    // }
    // 检查 secret token
    const secretToken = req.query.token;
    if (secretToken !== token) {
      console.warn('Received unauthorized request');
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const { message } = req.body;

    if (message.text === '/start') {
      // const msg =
      //   'Welcome to <i>NextJS News Channel</i> <b>' +
      //   message.from.first_name +
      //   '</b>.%0ATo get a list of commands sends /help';
      // const ret = await fetch(
      //   `https://api.telegram.org/bot${token}/sendMessage?chat_id=${message.chat.id}&text=${msg}&parse_mode=HTML`
      // );      
      const welcomeMsg =
       `Welcome to <i>NextJS News Channel</i>, <b>${message.from.first_name}</b>.\nTo get a list of commands, send /help`;
      await sendTelegramMessage(message.chat.id, welcomeMsg);
    }
    else if (message.reply_to_message) {  // Forward the message
      const match = message.reply_to_message.text.match(/^Message from user (\d+):/);
      let chatId = myChatId;
      let msg = 'Message from user ' + message.chat.id + ': ' + message.text +
      '\n@'+message.from.username;
      if (match) {
        chatId = parseInt(match[1]);
        msg = message.text;
      }
      // const replyMessagePromise = fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       chat_id: chatId,
      //       text: msg,
      //     }),
      //   });
      const replyMessagePromise = sendTelegramMessage(chatId, msg);

      const okMessagePromise = sendTelegramMessage(message.chat.id, '回复成功！');

      await Promise.all([replyMessagePromise, okMessagePromise]);
    }
    else if (message && message.text) {
      const sendMessagePromise = sendTelegramMessage(myChatId, `Message from user ${message.chat.id}: ${message.text}\n@${message.from.username}`);
      const receivedMessagePromise = sendTelegramMessage(message.chat.id, '已收到您的消息，我们将尽快回复您！');

      // Wait for the promises to complete before sending the response
      await Promise.all([sendMessagePromise, receivedMessagePromise]);

    } else {
      res.status(200).send({});
    }

    // Respond to the webhook request
    res.status(200).send({});

  } else {
    res.status(405).send({ error: 'We only support POST requests' });
  }
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

// // Listen for any kind of message. There are different kinds of
// // messages.
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });

// // 监听任意消息类型
// bot.onAnyMessage((msg) => {
//   const chatId = msg.chat.id;

//   // 发送确认消息
//   bot.sendMessage(chatId, 'Received your message');  
// });

