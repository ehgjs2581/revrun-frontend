import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Meta Graph API로 토큰 갱신
async function refreshMetaToken(currentToken) {
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return {
    access_token: data.access_token,
    expires_in: data.expires_in // 초 단위 (약 5184000 = 60일)
  };
}

export default async function handler(req, res) {
  // Cron Job 인증 (Vercel에서 호출 시)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 수동 실행도 허용 (관리자용)
    if (req.method !== 'POST' || req.query.manual !== 'true') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  try {
    // 현재 토큰 가져오기 (환경변수 또는 DB에서)
    let currentToken = process.env.META_ACCESS_TOKEN;
    
    // DB에 저장된 토큰이 있으면 그걸 사용
    const { data: tokenData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'meta_access_token')
      .single();
    
    if (tokenData?.value) {
      currentToken = tokenData.value;
    }

    if (!currentToken) {
      return res.status(400).json({ success: false, error: 'No token found' });
    }

    // 토큰 갱신
    const newTokenData = await refreshMetaToken(currentToken);
    
    // DB에 새 토큰 저장
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();
    
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

    // 갱신 로그 저장
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

    // 실패 로그 저장
    await supabase.from('token_logs').insert({
      action: 'refresh',
      status: 'failed',
      error_message: error.message,
      created_at: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
