const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// =========================
// 기본 설정
// =========================
app.set("trust proxy", 1); // Railway/Cloudflare 환경 안전빵

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 세션 설정
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "revrun-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 6, // 6시간
    },
  })
);

// =========================
// 정적 파일 (public 폴더 제공)
// =========================
app.use(express.static(path.join(__dirname, "public")));

// =========================
// DB 없이 임시 계정 (B 방식)
// =========================
const USERS = [
  { username: "admin", password: process.env.ADMIN_PW || "admin1234", name: "관리자", role: "admin" },
  { username: "client1", password: "1234", name: "김도헌", role: "client" },
  { username: "client2", password: "1234", name: "문세음", role: "client" },
];

// =========================
// API: 로그인
// =========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
    });
  }

  req.session.user = {
    username: user.username,
    name: user.name,
    role: user.role,
  };

  return res.json({ ok: true });
});

// =========================
// API: 내 정보(세션 확인)
// =========================
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: req.session.user });
});

// =========================
// API: 로그아웃
// =========================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

// =========================
// 기본 접속 -> report/login.html
// =========================
app.get("/", (req, res) => {
  return res.redirect("/report/login.html");
});

app.listen(PORT, () => {
  console.log("✅ Server running on port:", PORT);
});
