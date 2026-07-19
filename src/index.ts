// @ts-nocheck
import { Telegraf } from 'telegraf';

import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

// تعديل أمر عن البوت المطور خصيصاً لصالح الخليفي
bot.command('about', (ctx) => {
  const aboutText = 
    `🤖 *TikTok Downloader Bot*\n` +
    `📦 *الإصدار:* v2.0.0\n\n` +
    `👨‍💻 *تطوير وبناء:* صالح الخليفي\n` +
    `🛠️ *التخصص:* مهندس إلكترونيات ومطور حلول برمجية\n\n` +
    `✨ *عن البوت:* أداة ذكية وسريعة مخصصة لجلب وتحميل مقاطع تيك توك بجودة عالية وبدون علامة مائية مباشرة داخل تليجرام.`;

  return ctx.reply(aboutText, { parse_mode: 'Markdown' });
});

bot.on('message', greeting());

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
