// @ts-nocheck
import { Context } from 'telegraf';

const https = require('https');

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

  const tiktokRegex = /(https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+)/i;
  const hasTiktokLink = messageText.match(tiktokRegex);

  // ─── 1. معالجة رابط تيك توك ───
  if (hasTiktokLink) {
    const tiktokUrl = hasTiktokLink[0];

    let loadingMsg: any;
    try {
      loadingMsg = await ctx.reply('جاري استخراج خيارات التحميل... ⏳', {
        reply_parameters: { message_id: messageId }
      });
    } catch (e) {
      console.error(e);
    }

    try {
      const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
      const resData = await fetchTiktokData(apiUrl);

      if (resData && resData.code === 0 && resData.data) {
        const sdUrl = resData.data.play;
        const hdUrl = resData.data.hdplay || sdUrl;
        const videoTitle = resData.data.title || 'اضغط على الجودة المطلوبة للتحميل:';

        // أزرار روابط مباشرة تفتح في المتصفح أو تطبيق التحميل فوراً دون قيود حجم البايت
        const actionKeyboard = {
          inline_keyboard: [
            [
              { text: '🎬 تحميل جودة عادية', url: sdUrl },
              { text: '🔥 تحميل جودة عالية HD', url: hdUrl }
            ]
          ]
        };

        if (loadingMsg) {
          await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }

        await ctx.reply(`عنوان الفيديو: \n"${videoTitle}"\n\nاختر جودة التحميل المناسبة:`, {
          reply_parameters: { message_id: messageId },
          reply_markup: actionKeyboard
        });

      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('عذراً يا صالح، حدث خطأ أثناء محاولة جلب الفيديو. تأكد من أن حساب الفيديو عام وليس خاصاً.', {
        reply_parameters: { message_id: messageId }
      });
      if (loadingMsg) {
        await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
      }
    }
    return; 
  }

  // ─── 2. أمر البدء /start ───
  if (messageText === '/start') {
    const firstName = ctx.from?.first_name || 'العزيز';
    const welcomeText =
      `أهلاً بك يا ${firstName} في بوت تحميل مقاطع تيك توك! 🚀🎬\n\n` +
      `البوت مخصص لمساعدتك في تحميل مقاطع TikTok بأعلى جودة ممكنة وبدون علامة مائية مباشرة داخل تيليجرام. ✨\n\n` +
      `👇 كل ما عليك فعله الآن:\n` +
      `الصق رابط الفيديو المراد تحميله هنا..`;

    await ctx.reply(welcomeText, {
      reply_parameters: { message_id: messageId },
      reply_markup: { remove_keyboard: true }
    });
    return;
  }

  // ─── 3. نص عشوائي ───
  await ctx.reply('⚠️ من فضلك، قم بإرسال أو لصق رابط فيديو TikTok صحيح ليتم تحميله فوراً.', {
    reply_parameters: { message_id: messageId }
  });
};

export { greeting };
