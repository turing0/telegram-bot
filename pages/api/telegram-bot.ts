import { NextApiRequest, NextApiResponse } from 'next'
import { TelegramBot } from 'node-telegram-bot-api';

const myChatId = '5525041552'
const token = '5635808285:AAGP1SilFciikrQd_SMr68J70OlVVJKiVsk'
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '你好！请向我发送消息~');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    const forwardedMessage = `Message from user ${chatId}: ${msg.text}\n@${username}`;

    bot.sendMessage(chatId, '您的反馈已记录！我们将尽快回复您！');
    bot.sendMessage(myChatId, forwardedMessage);
});

export default (req, res) => {
    res.status(200).json({ status: 'Bot is running...' });
  };