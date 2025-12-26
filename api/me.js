import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
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
    // 쿠키에서 세션 ID 가져오기
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    if (!sessionId) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다' });
    }

    // Supabase에서 유저 정보 가져오기
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, role, meta_account_id, company, plan, status')
      .eq('id', sessionId)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, error: '유효하지 않은 세션입니다' });
    }

    return res.status(200).json({
      ok: true,
      user: {
        user_id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        meta_account_id: user.meta_account_id,
        company: user.company,
        plan: user.plan,
        status: user.status
      }
    });

  } catch (err) {
    console.error('Me API error:', err);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다' });
  }
}