// @ts-nocheck
import { Context } from 'telegraf';

const about = () => async (ctx: any) => {
  const messageId = ctx.message?.message_id;

  // نص الرسالة التعريفية المنسق باسمك وتخصصك المتميز
  const aboutText = 
    `🤖 *TikTok Downloader Bot*\n` +
    `📦 *الإصدار:* v2.0.0\n\n` +
    `👨‍💻 *تطوير وبناء:* صالح الخليفي\n` +
    `🛠️ *التخصص:* مهندس إلكترونيات ومطور حلول برمجية\n\n` +
    `✨ *عن البوت:* أداة ذكية وسريعة مخصصة لجلب وتحميل مقاطع تيك توك بجودة عالية وبدون علامة مائية مباشرة داخل تليجرام.`;

  try {
    await ctx.reply(aboutText, {
      parse_mode: 'Markdown',
      reply_parameters: messageId ? { message_id: messageId } : undefined,
    });
  } catch (error) {
    console.error('Error in about command:', error);
  }
};

export { about };
