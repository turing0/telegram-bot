// import { Telegram } from 'telegram-bot-api';

const myChatId = '5525041552'
const token = '5975588613:AAFlmhxm_XRZ4RhqLOnfK7StJVbkJ7fINZk'
const TelegramBot = require('node-telegram-bot-api');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;

    if (message && message.text) {
      const response2 = {
        method: 'sendMessage',
        chat_id: message.chat.id,
        text: '您的回复已收到，我们将尽快回复您！',
      };
      res.status(200).json(response2);

      // Prepare a response
      const response = {
        method: 'sendMessage',
        chat_id: message.chat.id,
        text: message.text, // Echo back the user's message
      };
      // Send the response
      res.status(200).json(response);
      
    } else {
      res.status(200).send({});
    }
  } else {
    res.status(405).send({ error: 'We only support POST requests' });
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

