import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 8080;

// ====== path helpers (ESM) ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== middleware ======
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    name: "revrun.sid",
    secret: process.env.SESSION_SECRET || "revrun-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Railway에서도 일단 false로(https라도 프록시 때문에 꼬이면 로그인 안될 수 있음). 나중에 true로 개선 가능
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 12, // 12h
    },
  })
);

// ====== Supabase ======
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
console.log("Supabase client initialized");

// ====== static ======
app.use(express.static(path.join(__dirname, "public")));

// ====== page access guards (HTML용: redirect OK) ======
app.use("/report", (req, res, next) => {
  // 로그인 페이지는 예외
  if (req.path === "/login.html") return next();
  if (!req.session.user) return res.redirect("/report/login.html");
  next();
});

app.use("/admin", (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/report/login.html");
  }
  next();
});

// ====== API guards (API용: redirect 절대 금지 / JSON으로만) ======
function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  if (req.session.user.role !== "admin") return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  next();
}

// ====== health ======
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ====== auth ======
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, error: "username,password required" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, name, role, password")
      .eq("username", username)
      .single();

    if (error || !user) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    // 지금은 plaintext 가정 (나중에 bcrypt로 교체)
    if (user.password !== password) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    return res.json({ ok: true, user: req.session.user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session?.user) return res.json({ ok: true, user: null });
  return res.json({ ok: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("revrun.sid");
    return res.json({ ok: true });
  });
});

// ====== ADMIN APIs ======
app.get("/api/admin/clients", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, role")
    .eq("role", "client")
    .order("username", { ascending: true });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, clients: data || [] });
});

app.post("/api/admin/report", requireAdmin, async (req, res) => {
  const { user_id, period, payload } = req.body || {};
  if (!user_id || !payload) return res.status(400).json({ ok: false, error: "user_id,payload required" });

  const { data, error } = await supabase
    .from("reports")
    .insert([{ user_id, period: period || "최근 7일", payload }])
    .select("id, created_at")
    .single();

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, saved: data });
});

app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ ok: false, error: "user_id required" });

  const { data, error } = await supabase
    .from("reports")
    .select("id, period, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, reports: data || [] });
});

// ====== CLIENT REPORT API ======
app.get("/api/report", requireAuth, async (req, res) => {
  const { username, role, name } = req.session.user;

  // admin 샘플
  if (role === "admin") {
    return res.json({
      ok: true,
      report: {
        clientName: "전체(샘플)",
        period: "최근 7일",
        kpis: [],
        highlights: ["관리자 샘플 화면"],
        actions: [],
      },
    });
  }

  // 1) users 테이블에서 내 user.id 가져오기
  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("id, name, username")
    .eq("username", username)
    .single();

  if (uErr || !user) {
    return res.json({
      ok: true,
      report: {
        clientName: name,
        period: "최근 7일",
        kpis: [],
        highlights: ["유저 조회 실패"],
        actions: [],
      },
    });
  }

  // 2) reports 최신 1개
  const { data: r, error: rErr } = await supabase
    .from("reports")
    .select("period, payload, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rErr || !r) {
    return res.json({
      ok: true,
      report: {
        clientName: user.name || name,
        period: "최근 7일",
        kpis: [],
        highlights: ["아직 등록된 리포트가 없습니다. 관리자에게 요청하세요."],
        actions: [],
      },
    });
  }

  return res.json({
    ok: true,
    report: {
      clientName: user.name || name,
      period: r.period || "최근 7일",
      ...(r.payload || {}),
      _meta: { created_at: r.created_at },
    },
  });
});

// ====== fallback routes ======
app.get("/", (req, res) => res.redirect("/report/login.html"));

// ====== start ======
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
