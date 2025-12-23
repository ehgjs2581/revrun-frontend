import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  (process.env.SUPABASE_URL || "").trim(),
  // ✅ 서버(API)에서는 Service Role Key 사용 (RLS 뚫고 조회 가능)
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "https://revrun.co.kr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { username, password } = req.body || {};
    const u = String(username || "").trim();
    const p = String(password || "").trim();

    if (!u || !p) {
      return res
        .status(400)
        .json({ ok: false, error: "아이디와 비밀번호를 입력하세요" });
    }

    // ✅ users 테이블에서 username만으로 유저 조회 후 password 비교 (디버깅 쉬움)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, user_id, username, role, password, name")
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

    // ✅ 세션값: user_id 있으면 그거, 없으면 id, 그것도 없으면 username
    const sessionId = user.user_id ?? user.id ?? user.username;

    // 쿠키 설정
    res.setHeader("Set-Cookie", [
      `session=${encodeURIComponent(String(sessionId))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      `user_role=${encodeURIComponent(String(user.role || ""))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      `username=${encodeURIComponent(String(user.username || ""))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
    ]);

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id ?? user.user_id ?? null,
        username: user.username,
        role: user.role,
        name: user.name ?? null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다" });
  }
}

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
