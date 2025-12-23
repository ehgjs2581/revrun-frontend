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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cookies = parseCookies(req.headers.cookie);
  const userRole = cookies.user_role;

  if (userRole !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin only' });
  }

  try {
    // GET: 리포트 내역 조회
    if (req.method === 'GET') {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ ok: false, error: 'user_id required' });
      }

      const { data: reports, error } = await supabase
        .from('reports')
        .select('report_id, period, payload, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.status(200).json({
        ok: true,
        reports: reports || []
      });
    }

    // POST: 리포트 작성
    if (req.method === 'POST') {
      const { user_id, period, payload } = req.body;

      if (!user_id || !period || !payload) {
        return res.status(400).json({ ok: false, error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          user_id,
          period,
          payload
        }])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.status(200).json({
        ok: true,
        report: data
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
