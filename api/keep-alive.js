import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Vercel Cron 인증 또는 수동 실행 허용
  const authHeader = req.headers.authorization;
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = req.query.manual === 'true';

  if (!isCron && !isManual) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Supabase에 간단한 쿼리 보내서 깨어있게 함
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    if (error) {
      console.error('Supabase ping 실패:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // 토큰 만료 체크도 같이
    let tokenWarning = null;
    try {
      const { data: tokenData } = await supabase
        .from('settings')
        .select('expires_at')
        .eq('key', 'meta_access_token')
        .single();

      if (tokenData?.expires_at) {
        const daysLeft = Math.floor((new Date(tokenData.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 7) {
          tokenWarning = `메타 토큰 만료 ${daysLeft}일 남음! 갱신 필요!`;
          console.warn(tokenWarning);
        }
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Supabase is alive',
      timestamp: new Date().toISOString(),
      tokenWarning
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
