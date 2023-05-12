import { NextApiRequest, NextApiResponse } from 'next'
import TelegramBot from 'telegram-bot-api'

const myChatId = '5525041552'
const token = '5635808285:AAGP1SilFciikrQd_SMr68J70OlVVJKiVsk'

const bot = new TelegramBot({
  token: token,
})

bot.on('message', (message) => {
  const forwardedMessage = `Message from user ${message.chat.id}: ${message.text}\n@${message.from.username}`
  bot.sendMessage({
    chat_id: myChatId,
    text: forwardedMessage,
  })
})

bot.on('callback_query', (callbackQuery) => {
  const userMessage = callbackQuery.data
  const chatId = callbackQuery.message.chat.id
  const messageId = callbackQuery.message.message_id

  if (callbackQuery.message.reply_to_message?.text.startsWith('Message from user')) {
    const userId = callbackQuery.message.reply_to_message.text.split(':')[0].split('user ')[1]
    bot.sendMessage({
      chat_id: userId,
      text: userMessage,
    })
  } else {
    const forwardedMessage = `Message from user ${chatId}: ${userMessage}\n@${callbackQuery.from.username}`
    bot.sendMessage({
      chat_id: myChatId,
      text: forwardedMessage,
    })
    bot.sendMessage({
      chat_id: chatId,
      text: '回复成功！',
      reply_to_message_id: messageId,
    })
  }
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await bot.processUpdate(req.body)
    res.status(200).json({ message: 'success' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'error' })
  }
}

export default handler