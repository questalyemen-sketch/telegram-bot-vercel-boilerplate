import { VercelRequest, VercelResponse } from '@vercel/node';
import { startVercel } from '../src';

export default async function handle(req: VercelRequest, res: VercelResponse) {
  const requestTime = new Date().toISOString();

  // 1. التعامل الذكي مع طلبات المتصفح (GET)
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'active',
      message: 'Telegram Bot Webhook is running smoothly!',
      developer: 'SALΞH',
      timestamp: requestTime
    });
    return;
  }

  // 2. تمرير طلبات الـ Webhook الفعلية (POST) من تليجرام
  try {
    await startVercel(req, res);
  } catch (error: any) {
    // تسجيل الأخطاء بشكل منظم في الـ Logs للرجوع إليها بسهولة
    console.error(`[Webhook Error] [${requestTime}]:`, error.message || error);
    
    // رد احترافي موحد بدلاً من صفحات الـ HTML التقليدية
    res.status(500).json({
      ok: false,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred inside the handler.'
    });
  }
}
// force build
