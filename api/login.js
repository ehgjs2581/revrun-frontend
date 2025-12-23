import { createClient } from "@supabase/supabase-js";

const URL = (process.env.SUPABASE_URL || "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
// 디버그: 어떤 Supabase를 보고 있는지 확인용
if (req.query?.debug === "1") {
  return res.status(200).json({ ok: true, supabaseUrl: process.env.SUPABASE_URL });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "https://revrun.co.kr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
// ✅ 디버그: 브라우저에서 GET으로 확인 가능하게
if (req.method === "GET" && req.query?.debug === "1") {
  return res.status(200).json({
    ok: true,
    supabaseUrl: process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  // ✅ 키 누락이면 서버가 죽지 않고 이유를 말해줌
  if (!URL || !SERVICE_KEY) {
    return res.status(500).json({
      ok: false,
      error: "서버 환경변수 누락",
      detail: {
        has_SUPABASE_URL: !!URL,
        has_SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY,
      },
    });
  }

  const supabase = createClient(URL, SERVICE_KEY);

  try {
    const { username, password } = req.body || {};
    const u = String(username || "").trim();
    const p = String(password || "").trim();

    if (!u || !p) {
      return res
        .status(400)
        .json({ ok: false, error: "아이디와 비밀번호를 입력하세요" });
    }

    // ✅ username으로만 조회 후 password 비교
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, role, password, name")
      .eq("username", u)
      .single();

    if (error || !user) {
      return res
        .status(401)
        .json({ ok: false, error: "아이디 또는 비밀번호가 틀렸습니다" });
    }

    if ((user.password || "") !== p) {
      return res
        .status(401)
        .json({ ok: false, error: "아이디 또는 비밀번호가 틀렸습니다" });
    }

    const sessionId = user.id || user.username;

    res.setHeader("Set-Cookie", [
      `session=${encodeURIComponent(String(sessionId))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      `user_role=${encodeURIComponent(String(user.role || ""))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
    ]);

    return res.status(200).json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ ok: false, error: "서버 오류" });
  }
}
