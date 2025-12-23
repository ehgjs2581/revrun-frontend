import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://revrun.co.kr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: '아이디와 비밀번호를 입력하세요' });
    }

    // Supabase에서 유저 찾기
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, error: '아이디 또는 비밀번호가 틀렸습니다' });
    }

    // 세션 쿠키 설정
    res.setHeader('Set-Cookie', [
      `session=${user.user_id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      `user_role=${user.role}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    ]);

    return res.status(200).json({
      ok: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다' });
  }
}
