import createDebug from 'debug';
import https from 'https';

const debug = createDebug('bot:greeting_text');

// دالة مستقرة ومتوافقة بالكامل مع نظام Node.js لجلب بيانات الفيديو
const fetchTiktokData = (apiUrl: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(apiUrl, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err: any) => {
      reject(err);
    });
  });
};

const replyToMessage = (ctx: any, messageId: number, text: string) => {
  return ctx.reply(text, {
    reply_parameters: { message_id: messageId },
  });
};

const greeting = () => async (ctx: any) => {
  debug('Triggered "greeting" text command');

  const messageId = ctx.message?.message_id;
  if (!messageId) return;

  const messageText = ctx.message?.text || '';

  // التحقق من وجود رابط تيك توك في الرسالة
  const tiktokRegex = /(https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+)/i;
  const hasTiktokLink = messageText.match(tiktokRegex);

  // ─── 1. إذا أرسل المستخدم رابط تيك توك ───
  if (hasTiktokLink) {
    const tiktokUrl = hasTiktokLink[0];

    // إرسال رسالة انتظار مؤقتة
    let loadingMsg: any;
    try {
      loadingMsg = await ctx.reply('جاري جلب الفيديو بدون علامة مائية... ⏳', {
        reply_parameters: { message_id: messageId }
      });
    } catch (e) {
      console.error('Error sending loading message', e);
    }

    try {
      const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
      const resData = await fetchTiktokData(apiUrl);

      if (resData && resData.code === 0 && resData.data?.play) {
        const videoUrl = resData.data.play;
        const videoTitle = resData.data.title || 'تم التحميل بنجاح! 🎬';

        // إرسال الفيديو مباشرة داخل تليجرام
        await ctx.replyWithVideo(videoUrl, {
          caption: videoTitle,
          reply_parameters: { message_id: messageId }
        });

        // حذف رسالة الانتظار لتنظيف المحادثة
        if (loadingMsg) {
          await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('عذراً يا صالح، حدث خطأ أثناء محاولة تحميل الفيديو. تأكد من أن حساب الفيديو عام وليس خاصاً.', {
        reply_parameters: { message_id: messageId }
      });
      if (loadingMsg) {
        await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
      }
    }
    return; // إنهاء الدالة حتى لا يتنفذ كود الترحيب
  }

  // ─── 2. إذا أرسل المستخدم أي رسالة عادية أخرى ───
  const firstName = ctx.from?.first_name || '';
  const lastName = ctx.from?.last_name || '';
  const userName = `${firstName} ${lastName}`.trim() || 'Friend';

  await replyToMessage(ctx, messageId, `Hello, ${userName}!`);
};

export { greeting };
