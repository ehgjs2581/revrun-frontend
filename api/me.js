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
    const userId = cookies.session;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, error: 'Invalid session' });
    }

    return res.status(200).json({
      ok: true,
      user: {
        user_id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
