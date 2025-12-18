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
// 정적 파일
// =========================
app.use(express.static(path.join(__dirname, "public")));

// =========================
// 계정
// =========================
const USERS = [
 const USERS = [
  { username: "admin", password: "admin1234", name: "관리자", role: "admin" },

  // ✅ 기존 1234 삭제하고 강하게
  { username: "client1", password: "Client1!2025", name: "김도헌", role: "client" },
  { username: "client2", password: "Client2!2025", name: "문세음", role: "client" },
];


// =========================
// 더미 리포트
// =========================
const DUMMY_REPORTS = {
  client1: {
    clientName: "김도헌",
    period: "최근 7일",
    kpis: [
      { label: "광고비", value: "₩120,000" },
      { label: "문의", value: "18건" },
      { label: "CPL", value: "₩6,667" },
      { label: "전환율", value: "3.2%" },
    ],
  },
  client2: {
    clientName: "문세음",
    period: "최근 7일",
    kpis: [
      { label: "광고비", value: "₩80,000" },
      { label: "문의", value: "11건" },
      { label: "CPL", value: "₩7,273" },
      { label: "전환율", value: "2.7%" },
    ],
  },
};

// =========================
// 가드
// =========================
app.use("/report", (req, res, next) => {
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

// =========================
// 로그인
// =========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ ok: false });

  req.session.user = user;
  res.json({
    ok: true,
    redirect: user.role === "admin"
      ? "/admin/dashboard.html"
      : "/report/dashboard.html"
  });
});

// =========================
// 관리자: 고객 리포트 조회 (B-2 핵심)
// =========================
app.get("/api/admin/report", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ ok: false });
  }

  const username = req.query.user;
  const report = DUMMY_REPORTS[username];

  if (!report) {
    return res.json({ ok: false, message: "리포트 없음" });
  }

  res.json({ ok: true, report });
});

// =========================
app.listen(PORT, () => {
  console.log("✅ Server running on port:", PORT);
});
