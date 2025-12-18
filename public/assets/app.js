// ====== 고객 로그인 (API) ======
const DASHBOARD_URL = "/report/dashboard.html";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) {
    console.error("loginForm not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value?.trim() ?? "";
    const password = document.getElementById("password")?.value ?? "";

    if (!username || !password) {
      alert("아이디/비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "로그인 실패");
        return;
      }

      // 필요하면 로컬 저장(대시보드에서 쓰게)
      localStorage.setItem("customer", JSON.stringify(data.customer || {}));

      window.location.href = DASHBOARD_URL;
    } catch (err) {
      console.error(err);
      alert("서버 연결 실패. 잠시 후 다시 시도해주세요.");
    }
  });
});
