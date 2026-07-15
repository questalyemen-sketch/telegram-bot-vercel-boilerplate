import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

// تعريف واجهة البيانات لمنع أخطاء بناء TypeScript الصارمة في Vercel
interface TikWMResponse {
  code: number;
  msg: string;
  data?: {
    play: string;
    title?: string;
  };
}

const replyToMessage = (ctx: Context, messageId: number, string: string) =>
  ctx.reply(string, {
    reply_parameters: { message_id: messageId },
  });

const greeting = () => async (ctx: Context) => {
  debug('Triggered "greeting" text command');

  const messageId = ctx.message?.message_id;
  if (!messageId) return;

  // جلب النص المرسل في الرسالة
  const messageText = (ctx.message as any).text || '';

  // تعبير نمطي (Regex) للتحقق مما إذا كانت الرسالة تحتوي على رابط تيك توك
  const tiktokRegex = /(https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+)/i;
  const hasTiktokLink = messageText.match(tiktokRegex);

  // ─── 1. إذا أرسل المستخدم رابط تيك توك ───
  if (hasTiktokLink) {
    const tiktokUrl = hasTiktokLink[0];

    // إرسال رسالة انتظار سريعة للمستخدم
    const loadingMsg = await ctx.reply('جاري تحميل الفيديو بدون علامة مائية... ⏳', {
      reply_parameters: { message_id: messageId }
    });

    try {
      // استدعاء API مجاني وسريع جداً لجلب الفيديو بدون حقوق
      const response = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);
      const resData = (await response.json()) as TikWMResponse;

      if (resData.code === 0 && resData.data?.play) {
        const videoUrl = resData.data.play;
        const videoTitle = resData.data.title || 'تم التحميل بنجاح! 🎬';

        // إرسال الفيديو مباشرة داخل تليجرام
        await ctx.replyWithVideo(videoUrl, {
          caption: videoTitle,
          reply_parameters: { message_id: messageId }
        });

        // حذف رسالة الانتظار لتنظيف المحادثة
        await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
      } else {
        throw new Error('Failed to fetch video link from API');
      }
    } catch (error) {
      console.error(error);
      // في حال حدوث مشكلة، نبلغ المستخدم ونحذف رسالة التحميل
      await ctx.reply('عذراً، لم أتمكن من تحميل الفيديو. تأكد من أن الحساب صاحب الفيديو عام وليس خاصاً.', {
        reply_parameters: { message_id: messageId }
      });
      await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
    }
    return; // ننهي الدالة هنا حتى لا يتم تفعيل كود الترحيب العادي
  }

  // ─── 2. إذا أرسل المستخدم أي رسالة عادية أخرى ───
  const firstName = ctx.from?.first_name || '';
  const lastName = ctx.from?.last_name || '';
  const userName = `${firstName} ${lastName}`.trim() || 'Friend';

  await replyToMessage(ctx, messageId, `Hello, ${userName}!`);
};

export { greeting };
