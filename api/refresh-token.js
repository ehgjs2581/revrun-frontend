import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Meta Graph API로 장기 토큰 갱신
async function refreshMetaToken(currentToken) {
  const url = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in // 약 5184000초 = 60일
  };
}

export default async function handler(req, res) {
  // Vercel Cron 인증 또는 수동 실행 허용
  const authHeader = req.headers.authorization;
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = req.query.manual === 'true';

  if (!isCron && !isManual) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // 1. 현재 토큰 가져오기 (DB 우선, 없으면 환경변수)
    let currentToken = process.env.META_ACCESS_TOKEN;

    const { data: tokenData } = await supabase
      .from('settings')
      .select('value, expires_at')
      .eq('key', 'meta_access_token')
      .single();

    if (tokenData?.value) {
      currentToken = tokenData.value;

      // 만료까지 14일 이상 남았으면 갱신 스킵
      if (tokenData.expires_at) {
        const daysLeft = Math.floor((new Date(tokenData.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 14 && !isManual) {
          return res.status(200).json({
            success: true,
            message: `토큰 아직 유효 (${daysLeft}일 남음). 갱신 스킵.`,
            expires_at: tokenData.expires_at,
            days_left: daysLeft
          });
        }
      }
    }

    if (!currentToken) {
      return res.status(400).json({ success: false, error: 'No token found' });
    }

    // 2. 토큰 갱신
    const newTokenData = await refreshMetaToken(currentToken);
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();

    // 3. DB에 저장
    const { error: upsertError } = await supabase
      .from('settings')
      .upsert({
        key: 'meta_access_token',
        value: newTokenData.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (upsertError) {
      console.error('DB 저장 오류:', upsertError);
      return res.status(500).json({ success: false, error: 'Failed to save token' });
    }

    // 4. 성공 로그
    await supabase.from('token_logs').insert({
      action: 'refresh',
      status: 'success',
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    });

    console.log('Meta 토큰 갱신 성공! 만료일:', expiresAt);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      expires_at: expiresAt,
      expires_in_days: Math.floor(newTokenData.expires_in / 86400)
    });

  } catch (error) {
    console.error('토큰 갱신 오류:', error);

    // 실패 로그
    try {
      await supabase.from('token_logs').insert({
        action: 'refresh',
        status: 'failed',
        error_message: error.message,
        created_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error('로그 저장도 실패:', logErr);
    }

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
