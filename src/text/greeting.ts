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
  // ─── أ. معالجة ضغطات أزرار الجودة (Callback Query) ───
  if (ctx.callbackQuery) {
    const callbackData = ctx.callbackQuery.data || '';
    const messageId = ctx.callbackQuery.message?.message_id;

    if (callbackData.startsWith('dl_sd|') || callbackData.startsWith('dl_hd|')) {
      // إشعار سريع للمستخدم بجاري التحميل
      await ctx.answerCallbackQuery('جاري تحميل وإرسال الفيديو... ⏳').catch(() => {});

      // استخراج نوع الجودة والرابط المشفر من زر الضغط
      const [type, encodedVideoUrl] = callbackData.split('|');
      const videoUrl = decodeURIComponent(encodedVideoUrl);
      const videoTitle = type === 'dl_hd' ? 'تم التحميل بأعلى جودة (HD) 🔥🎬' : 'تم التحميل بالجودة العادية ⚡🎬';

      try {
        // إرسال الفيديو مباشرة كرد على الرسالة الأصلية
        await ctx.replyWithVideo(videoUrl, {
          caption: videoTitle
        });
        
        // تعديل أزرار الرسالة السابقة لتوضيح إتمام العملية بنجاح
        await ctx.editMessageText('✅ تم إرسال الفيديو بنجاح!', {
          reply_markup: { inline_keyboard: [] } // حذف الأزرار لعدم تكرار الضغط
        }).catch(() => {});

      } catch (error) {
        console.error(error);
        await ctx.reply('⚠️ عذراً، حدث خطأ أثناء إرسال ملف الفيديو من خوادم تليجرام. قد يكون حجم الفيديو المختار كبيراً جداً.');
      }
      return;
    }
  }

  // إذا لم تكن رسالة نصية عادية، نوقف التنفيذ
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
      loadingMsg = await ctx.reply('جاري فحص الرابط واستخراج خيارات الجودة... ⏳', {
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
        // إذا لم تتوفر جودة HD نستخدم الجودة العادية كبديل تلقائي
        const hdUrl = resData.data.hdplay || sdUrl; 

        // تشفير الروابط لكي نتمكن من تمريرها داخل أزرار التليجرام الشفافة (الحد الأقصى لبيانات الزر 64 بايت)
        const encSd = encodeURIComponent(sdUrl);
        const encHd = encodeURIComponent(hdUrl);

        // بناء الأزرار التفاعلية لاختيار الجودة
        const qualityKeyboard = {
          inline_keyboard: [
            [
              { text: '🎬 جودة عادية (سريع)', callback_data: `dl_sd|${encSd.substring(0, 50)}` },
              { text: '🔥 جودة عالية (HD)', callback_data: `dl_hd|${encHd.substring(0, 50)}` }
            ]
          ]
        };

        // حذف رسالة الانتظار أولاً
        if (loadingMsg) {
          await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }

        // إرسال خيارات الجودة للمستخدم
        await ctx.reply('اختر جودة تحميل الفيديو المناسبة لك:', {
          reply_parameters: { message_id: messageId },
          reply_markup: qualityKeyboard
        });

      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('عذراً، حدث خطأ أثناء جلب خيارات التحميل. تأكد من أن الرابط يعمل بشكل صحيح وحساب الفيديو عام.', {
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
      reply_markup: { remove_keyboard: true }
    });
    return;
  }

  // ─── 3. إذا أرسل أي نص آخر عشوائي ليس رابطاً ───
  await ctx.reply('⚠️ من فضلك، قم بإرسال أو لصق رابط فيديو TikTok صحيح ليتم تحميله فوراً.', {
    reply_parameters: { message_id: messageId }
  });
};

export { greeting };
