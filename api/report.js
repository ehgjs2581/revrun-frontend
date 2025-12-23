import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  return cookies;
}

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://revrun.co.kr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const userId = cookies.session;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    // 최신 리포트 가져오기
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !report) {
      return res.status(404).json({ 
        ok: false, 
        error: 'No report found',
        message: '아직 작성된 리포트가 없습니다.' 
      });
    }

    // payload에서 데이터 추출
    const payload = report.payload || {};

    return res.status(200).json({
      ok: true,
      report: {
        clientName: report.payload.clientName || '고객',
        period: report.period || '최근 7일',
        kpis: payload.kpis || [],
        highlights: payload.highlights || [],
        actions: payload.actions || [],
        _meta: {
          created_at: report.created_at
        }
      }
    });

  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
}