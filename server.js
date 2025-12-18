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
// 더미 리포트 데이터 (B단계)
// =========================
const DUMMY_REPORTS = {
  client1: {
    clientName: "김도헌",
    period: "최근 7일",
    kpis: [
      { label: "광고비", value: "₩ 120,000" },
      { label: "문의(리드)", value: "18건" },
      { label: "CPL", value: "₩ 6,667" },
      { label: "전환율", value: "3.2%" },
    ],
    highlights: [
      "리마케팅 비중 올리니 CPL 안정화",
      "상위 2개 소재가 문의의 61% 가져감",
      "예산 분배: 캠페인 예산 → 광고세트 예산이 더 안정적",
    ],
    actions: [
      "소재 2개 추가(후킹/증거형 1개씩)",
      "타겟 확장: 지역 + 관심사 1세트 추가",
      "랜딩 상단 CTA 문구 A/B 테스트",
    ],
  },
  client2: {
    clientName: "문세음",
    period: "최근 7일",
    kpis: [
      { label: "광고비", value: "₩ 80,000" },
      { label: "문의(리드)", value: "11건" },
      { label: "CPL", value: "₩ 7,273" },
      { label: "전환율", value: "2.7%" },
    ],
    highlights: [
      "후기/영수증 소재에서 클릭률 상승",
      "야간(20~23시) 전환이 상대적으로 좋음",
      "노출 대비 저장/길찾기 이벤트 반응 개선",
    ],
    actions: [
      "야간 예산 10~20% 증액",
      "후기형 소재 1개 더 추가",
      "상단 고정 문구를 ‘가격/혜택’ 중심으로 수정",
    ],
  },
};

// =========================
// 🔐 report 접근 가드 (로그인 필수)
// =========================
app.use("/report", (req, res, next) => {
  if (req.path === "/login.html") return next();
  if (!req.session.user) return res.redirect("/report/login.html");
  next();
});

// =========================
// 🔐 admin 접근 가드 (admin만)
// =========================
app.use("/admin", (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/report/login.html");
  }
  next();
});

// =========================
// 로그인 API
// =========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find((u) => u.username === username && u.password === password);

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

  const redirect = user.role === "admin" ? "/admin/dashboard.html" : "/report/dashboard.html";
  return res.json({ ok: true, redirect });
});

// =========================
// 로그인 유저 정보
// =========================
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: req.session.user });
});

// =========================
// ✅ client 리포트 API (B단계 핵심)
// =========================
app.get("/api/report", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });

  const { role, username, name } = req.session.user;

  // admin이면 샘플/전체용 응답
  if (role === "admin") {
    return res.json({
      ok: true,
      report: {
        clientName: "전체(샘플)",
        period: "최근 7일",
        kpis: [
          { label: "광고비", value: "₩ 200,000" },
          { label: "문의(리드)", value: "29건" },
          { label: "CPL", value: "₩ 6,897" },
          { label: "전환율", value: "3.0%" },
        ],
        highlights: ["전체 계정 합산 샘플 리포트", "고객별 보기 기능은 다음 단계에서"],
        actions: ["고객별 필터/검색 UI 추가", "DB 붙이기 전 더미 데이터 확장"],
      },
    });
  }

  // client면 계정별 더미 데이터
  const report = DUMMY_REPORTS[username];

  if (!report) {
    return res.json({
      ok: true,
      report: {
        clientName: name || username,
        period: "최근 7일",
        kpis: [
          { label: "광고비", value: "₩ 0" },
          { label: "문의(리드)", value: "0건" },
          { label: "CPL", value: "-" },
          { label: "전환율", value: "-" },
        ],
        highlights: ["이 계정은 아직 더미 데이터가 없음"],
        actions: ["서버의 DUMMY_REPORTS에 데이터 추가하면 됨"],
      },
    });
  }

  return res.json({ ok: true, report });
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
