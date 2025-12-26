import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
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
    const userRole = cookies.user_role;

    if (userRole !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin only' });
    }

    // 클라이언트 목록 가져오기
    const { data: clients, error } = await supabase
      .from('users')
      .select('user_id, username')
      .eq('role', 'client')
      .order('username');

    if (error) {
      return res.status(500).json({ ok: false, error: 'Database error' });
    }

    return res.status(200).json({
      ok: true,
      clients: clients || []
    });

  } catch (err) {
    console.error('Clients error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
