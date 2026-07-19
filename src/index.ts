// @ts-nocheck
import { Telegraf } from 'telegraf';

import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

// 1. أمر الترحيب والتشغيل الرئيسي (/start) مع تنظيف الأزرار القديمة
bot.start((ctx) => {
  const firstName = ctx.from?.first_name || 'العزيز';
  const welcomeText =
    `أهلاً بك يا ${firstName} في بوت تحميل مقاطع تيك توك! 🚀🎬\n\n` +
    `البوت مخصص لمساعدتك في تحميل مقاطع TikTok بأعلى جودة ممكنة وبدون علامة مائية مباشرة داخل تيليجرام. ✨\n\n` +
    `👇 كل ما عليك فعله الآن:\n` +
    `الصق رابط الفيديو المراد تحميله هنا..`;

  return ctx.reply(welcomeText, {
    reply_markup: { remove_keyboard: true }
  });
});

// أمر عن البوت المطور خصيصاً لصالح الخليفي
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
