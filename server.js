const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// =========================
// 기본 설정
// =========================
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 세션 설정
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "revrun-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 6,
    },
  })
);

// =========================
// 정적 파일 제공
// =========================
app.use(express.static(path.join(__dirname, "public")));

// =========================
// 임시 계정 (DB 전)
// =========================
const USERS = [
  { username: "admin", password: "admin1234", name: "관리자", role: "admin" },
  { username: "client1", password: "1234", name: "김도헌", role: "client" },
  { username: "client2", password: "1234", name: "문세음", role: "client" },
];

// =========================
// 🔐 로그인 가드 (핵심)
// =========================
app.use("/report", (req, res, next) => {
  // 로그인 페이지는 예외
  if (req.path === "/login.html") return next();

  // 세션 없으면 로그인 페이지로
  if (!req.session.user) {
    return res.redirect("/report/login.html");
  }

  next();
});

// =========================
// 로그인 API
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
// 로그인 유저 정보
// =========================
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: req.session.user });
});

// =========================
// 로그아웃
// =========================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/report/login.html");
  });
});

// =========================
// 기본 접속
// =========================
app.get("/", (req, res) => {
  res.redirect("/report/login.html");
});

app.listen(PORT, () => {
  console.log("✅ Server running on port:", PORT);
});
