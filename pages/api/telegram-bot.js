import { NextApiRequest, NextApiResponse } from 'next'
import { Telegram } from 'telegram-bot-api';
import TelegramBot from 'telegram-bot-api'

const myChatId = '5525041552'
const token = '5635808285:AAGP1SilFciikrQd_SMr68J70OlVVJKiVsk'


const bot = new TelegramBot(token, {webHook: {port: process.env.PORT}})

bot.on('message', msg => {
  bot.sendMessage(msg.chat.id, msg.text)
})

export default (req, res) => {
  bot.webHookHandler(req, res) 
}