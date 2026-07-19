// @ts-nocheck
import { Context } from 'telegraf';

// استخدام require التقليدي لتجنب قيود الاستيراد الصارمة في TypeScript
const https = require('https');

// دالة جلب بيانات الفيديو من الـ API
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

const greeting = () => async (ctx: any) => {
  const messageId = ctx.message?.message_id;
  if (!messageId) return;

  const messageText = ctx.message?.text || '';

  // تعبير نمطي لفحص روابط تيك توك
  const tiktokRegex = /(https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+)/i;
  const hasTiktokLink = messageText.match(tiktokRegex);

  // ─── 1. إذا أرسل المستخدم رابط تيك توك ───
  if (hasTiktokLink) {
    const tiktokUrl = hasTiktokLink[0];

    // رسالة انتظار
    let loadingMsg: any;
    try {
      loadingMsg = await ctx.reply('جاري جلب الفيديو بدون علامة مائية... ⏳', {
        reply_parameters: { message_id: messageId }
      });
    } catch (e) {
      console.error(e);
    }

    try {
      const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
      const resData = await fetchTiktokData(apiUrl);

      if (resData && resData.code === 0 && resData.data?.play) {
        const videoUrl = resData.data.play;
        const videoTitle = resData.data.title || 'تم التحميل بنجاح! 🎬';

        // إرسال الفيديو مباشرة
        await ctx.replyWithVideo(videoUrl, {
          caption: videoTitle,
          reply_parameters: { message_id: messageId }
        });

        // حذف رسالة الانتظار
        if (loadingMsg) {
          await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('عذراً، حدث خطأ أثناء محاولة تحميل الفيديو. تأكد من أن حساب الفيديو عام وليس خاصاً.', {
        reply_parameters: { message_id: messageId }
      });
      if (loadingMsg) {
        await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
      }
    }
    return; 
  }

  // ─── 2. إذا أرسل المستخدم أمر البدء /start ───
  if (messageText === '/start') {
    const firstName = ctx.from?.first_name || 'العزيز';
    const welcomeText =
      `أهلاً بك يا ${firstName} في بوت تحميل مقاطع تيك توك! 🚀🎬\n\n` +
      `البوت مخصص لمساعدتك في تحميل مقاطع TikTok بأعلى جودة ممكنة وبدون علامة مائية مباشرة داخل تيليجرام. ✨\n\n` +
      `👇 كل ما عليك فعله الآن:\n` +
      `الصق رابط الفيديو المراد تحميله هنا..`;

    await ctx.reply(welcomeText, {
      reply_parameters: { message_id: messageId },
      reply_markup: { remove_keyboard: true } // لتنظيف أي أزرار قديمة متبقية
    });
    return;
  }

  // ─── 3. إذا أرسل أي نص آخر عشوائي ليس رابطاً ───
  await ctx.reply('⚠️ من فضلك، قم بإرسال أو لصق رابط فيديو TikTok صحيح ليتم تحميله فوراً.', {
    reply_parameters: { message_id: messageId }
  });
};

export { greeting };
