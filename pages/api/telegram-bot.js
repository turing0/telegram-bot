import { NextApiRequest, NextApiResponse } from 'next'
import { Telegram } from 'telegram-bot-api';

const myChatId = '5525041552'
const token = '5635808285:AAGP1SilFciikrQd_SMr68J70OlVVJKiVsk'


const api = new Telegram({
    token: token,
  });
  
  api.on('message', (message) => {
    const chatId = message.chat.id;
    const username = message.from.username;
    const forwardedMessage = `Message from user ${chatId}: ${message.text}\n@${username}`;
    
    api.sendMessage({
      chat_id: chatId,
      text: '您的反馈已记录！我们将尽快回复您！'
    });
  
    api.sendMessage({
      chat_id: myChatId,
      text: forwardedMessage,
    });
  });
  
  export default (req, res) => {
    res.status(200).json({ status: 'Bot is running...' });
  };