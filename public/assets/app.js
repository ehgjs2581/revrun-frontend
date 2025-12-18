const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// ====== 기본 설정 ======
app.set("trust proxy", 1); // Railway/Cloudflare 같은 프록시 환경이면 필요할 때 많음

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== 세션 설정 ======
app.use(
  session({
    secret: process.env.SESSION_SECRET || "revrun-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // https일 때만 true
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 6, // 6시간
    },
  })
);

// ====== 정적 파일 제공(public 폴더) ======
app.use(express.static(path.join(__dirname, "public")));

// ====== DB 없이 임시 계정 ======
const USERS = [
  { username: "admin", password: process.env.ADMIN_PW || "admin1234", name: "관리자", role: "admin" },
  { username: "client1", password: "1234", name: "김도헌", role: "client" },
  { username: "client2", password: "1234", name: "문세음", role: "client" },
];

// ====== 로그인 API ======
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
    });
  }

  // ✅ 세션에 저장
  req.session.user = {
    username: user.username,
    name: user.name,
    role: user.role,
  };

  return res.json({ ok: true });
});

// ====== 내 정보 API (대시보드에서 씀) ======
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: req.session.user });
});

// ====== 로그아웃 ======
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

// ====== 루트 접속 시 로그인 페이지로 ======
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
