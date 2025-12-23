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

  // 세션 쿠키 삭제
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    'user_role=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  ]);

  return res.status(200).json({ ok: true });
}
