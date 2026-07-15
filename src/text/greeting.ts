import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const replyToMessage = (ctx: Context, messageId: number, text: string) =>
  ctx.reply(text, {
    reply_parameters: { message_id: messageId },
  });

const greeting = () => async (ctx: Context) => {
  debug('Triggered "greeting" text command');

  // نحاول الحصول على message_id إن وجد
  const messageId = ctx.message?.message_id;

  // نستخدم ctx.from لأنها متوفرة في أغلب أنواع التحديثات
  const firstName = ctx.from?.first_name || '';
  const lastName = ctx.from?.last_name || '';
  const username = ctx.from?.username || '';

  // نبني الاسم الكامل بدون undefined
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const userName = fullName || username || 'صديقي';

  // نص الترحيب باللغة العربية
  const greetingText = `مرحباً، ${userName}! يسعدني تواجدك مع البوت 🌟`;

  if (messageId) {
    await replyToMessage(ctx, messageId, greetingText);
  } else {
    await ctx.reply(greetingText);
  }
};

export { greeting };