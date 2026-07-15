import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const replyToMessage = (ctx: Context, messageId: number, string: string) =>
  ctx.reply(string, {
    reply_parameters: { message_id: messageId },
  });

const greeting = () => async (ctx: Context) => {
  debug('Triggered "greeting" text command');

  const messageId = ctx.message?.message_id;
  
  // استخدام ctx.from كطريقة مختصرة وآمنة جداً في مكتبة Telegraf لتجنب مشاكل الـ TypeScript
  const firstName = ctx.from?.first_name || '';
  const lastName = ctx.from?.last_name || '';
  const userName = `${firstName} ${lastName}`.trim() || 'Friend';

  if (messageId) {
    await replyToMessage(ctx, messageId, `Hello, ${userName}!`);
  }
};

export { greeting };
