const dummy = {
  name: "김도헌",
  spend: 1200000,
  leads: 43,
  cpl: 27907,
  status: "전환 안정화",
  memo: "광고 예산 대비 문의 증가 추세입니다. 현재 구조 유지 추천."
};

document.getElementById("userName").innerText = dummy.name + "님";
document.getElementById("spend").innerText = dummy.spend.toLocaleString() + "원";
document.getElementById("leads").innerText = dummy.leads + "건";
document.getElementById("cpl").innerText = dummy.cpl.toLocaleString() + "원";
document.getElementById("status").innerText = dummy.status;
document.getElementById("memo").innerText = dummy.memo;
