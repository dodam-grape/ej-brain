import { firebaseConfig } from "./firebase-config.js";

const NAV = [
  ["home", "홈", "⌂"], ["work", "업무", "✓"], ["annual", "연간계획", "▦"],
  ["parenting", "도담·소담", "♧"], ["assets", "자산", "₩"], ["travel", "여행", "✈"],
  ["move", "부동산·이사", "⌂"], ["growth", "자기계발", "✦"], ["goals", "목표관리", "◎"]
];
const LABEL = Object.fromEntries(NAV.map(([key, label]) => [key, label]));
const WORK_TYPES = [["br", "BR"], ["dd", "DD"], ["important", "중요"], ["normal", "보통"]];
const PLAN_ROWS = [["work", "업무"], ["family", "가족"], ["dodam", "도담"], ["sodam", "소담"], ["assets", "자산"]];
const ASSET_SECTIONS = {
  accounts: "현금·예금", loans: "대출현황", insurances: "보험현황", stocks: "주식현황",
  otherAssets: "기타현황", installments: "할부현황", properties: "부동산현황"
};
const $ = (selector, root = document) => root.querySelector(selector);
const KEY = "eunjeong-brain-v1";
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
const won = value => `${Math.abs(Number(value || 0)).toLocaleString("ko-KR")}원`;
const pct = value => `${Number(value || 0).toFixed(2).replace(/\.00$/, "")}%`;
const displayDate = value => value ? new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(`${value}T12:00:00`)) : "날짜 없음";
const n = value => Number(String(value ?? 0).replace(/,/g, "")) || 0;
const currentYear = new Date().getFullYear();
const currentMonth = () => new Date().toISOString().slice(0, 7);

function seed() {
  return {
    version: 2,
    profile: { name: "은정" },
    tasks: [
      { id: makeId(), title: "8월 점검 계획 정리", category: "work", date: iso(), workType: "br", priority: "high", done: false },
      { id: makeId(), title: "전세금·퇴거대출 일정 확인", category: "move", date: iso(2), priority: "normal", done: false },
      { id: makeId(), title: "도담이 방학 줄넘기 시간 확인", category: "parenting", date: iso(3), priority: "normal", done: false }
    ],
    events: [
      { id: makeId(), title: "주간 업무 정리", category: "work", date: iso(1), time: "09:00", workType: "normal", memo: "" },
      { id: makeId(), title: "도담·소담 일정 점검", category: "parenting", date: iso(3), time: "20:30", memo: "" }
    ],
    inbox: [],
    accounts: [
      { id: makeId(), name: "현금·예금", type: "cash", amount: 0, memo: "" },
      { id: makeId(), name: "연금", type: "investment", amount: 0, memo: "" }
    ],
    cards: [
      { id: makeId(), name: "신한카드", target: 0 },
      { id: makeId(), name: "하나카드", target: 700000 },
      { id: makeId(), name: "롯데카드", target: 300000 },
      { id: makeId(), name: "삼성카드", target: 0 }
    ],
    transactions: [],
    loans: [],
    insurances: [],
    stocks: [],
    otherAssets: [],
    installments: [],
    properties: [],
    childData: {
      dodam: {
        routines: [
          { id: makeId(), time: "07:00", title: "기상·아침 준비", days: "매일", memo: "" },
          { id: makeId(), time: "20:00", title: "독서·하루 정리", days: "매일", memo: "" }
        ],
        annual: [{ id: makeId(), year: currentYear, period: "연간", title: "초1 현행·독서·운동의 균형", memo: "" }],
        growth: [{ id: makeId(), area: "학습", target: "스스로 계획하고 끝내는 힘", progress: 20, memo: "" }]
      },
      sodam: {
        routines: [
          { id: makeId(), time: "07:30", title: "기상·유치원 준비", days: "평일", memo: "" },
          { id: makeId(), time: "19:30", title: "그림책·자유놀이", days: "매일", memo: "" }
        ],
        annual: [{ id: makeId(), year: currentYear, period: "연간", title: "놀이·그림책·신체활동 중심", memo: "" }],
        growth: [{ id: makeId(), area: "생활", target: "자기표현과 생활 자립", progress: 20, memo: "" }]
      }
    },
    annualPlans: [],
    trips: [],
    moveItems: [
      { id: makeId(), title: "샤시 전체", group: "수리", due: "2027-02-01", cost: 0, memo: "", done: false },
      { id: makeId(), title: "도배·장판·도장", group: "수리", due: "2027-02-15", cost: 0, memo: "", done: false },
      { id: makeId(), title: "입주청소", group: "이사", due: "2027-03-01", cost: 0, memo: "", done: false }
    ],
    growth: [
      { id: makeId(), title: "바이브코딩 익히기", progress: 25, memo: "" },
      { id: makeId(), title: "식품안전 업무 자동화", progress: 15, memo: "" }
    ],
    goals: [
      { id: makeId(), title: "은정 Brain 완성", group: "자기계발", progress: 35, due: "2026-09-30", memo: "" },
      { id: makeId(), title: "2027년 이사 준비", group: "가족", progress: 30, due: "2027-03-06", memo: "" }
    ]
  };
}

function normalize(raw = {}) {
  const base = seed();
  const data = { ...base, ...raw, version: 2 };
  const arrays = ["tasks", "events", "inbox", "accounts", "cards", "transactions", "loans", "insurances", "stocks", "otherAssets", "installments", "properties", "annualPlans", "trips", "moveItems", "growth", "goals"];
  arrays.forEach(key => { data[key] = Array.isArray(raw[key]) ? raw[key] : base[key]; });
  if (!data.cards.length) data.cards = base.cards;
  data.tasks = data.tasks.map(item => ({ workType: item.priority === "high" ? "important" : "normal", memo: "", ...item }));
  data.events = data.events.map(item => ({ workType: "normal", memo: "", ...item }));
  data.transactions = data.transactions.map(item => ({ card: "현금/계좌", performanceIncluded: false, memo: "", ...item }));
  data.moveItems = data.moveItems.map(item => ({ due: "2027-03-06", cost: 0, memo: "", ...item }));
  const legacyDebts = data.accounts.filter(item => item.type === "debt");
  data.accounts = data.accounts.filter(item => item.type !== "debt");
  legacyDebts.forEach(item => {
    if (!data.loans.some(loan => loan.id === item.id || loan.name === item.name)) {
      data.loans.push({ id: item.id || makeId(), name: item.name || "기존 대출", amount: n(item.amount), due: "", rate: 0, interestAmount: 0, interestMemo: "", memo: "기존 자산현황에서 자동 이전" });
    }
  });
  data.childData = {
    dodam: {
      routines: raw.childData?.dodam?.routines || base.childData.dodam.routines,
      annual: raw.childData?.dodam?.annual || base.childData.dodam.annual,
      growth: raw.childData?.dodam?.growth || base.childData.dodam.growth
    },
    sodam: {
      routines: raw.childData?.sodam?.routines || base.childData.sodam.routines,
      annual: raw.childData?.sodam?.annual || base.childData.sodam.annual,
      growth: raw.childData?.sodam?.growth || base.childData.sodam.growth
    }
  };
  return data;
}

class Store {
  constructor() {
    try { this.data = normalize(JSON.parse(localStorage.getItem(KEY)) || {}); } catch { this.data = seed(); }
    this.user = null; this.fb = null; this.timer = null; this.unsubscribe = null;
  }
  local() { localStorage.setItem(KEY, JSON.stringify(this.data)); }
  save(message = "") {
    this.local();
    if (this.user && this.fb) {
      clearTimeout(this.timer);
      this.timer = setTimeout(async () => {
        const { fire, db } = this.fb;
        await fire.setDoc(fire.doc(db, "brains", this.user.uid), { state: this.data, updatedAt: fire.serverTimestamp() }, { merge: true });
      }, 250);
    }
    if (message) toast(message);
  }
  async init() {
    this.local();
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) return;
    try {
      const [core, auth, fire] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
      ]);
      const app = core.initializeApp(firebaseConfig), a = auth.getAuth(app), db = fire.getFirestore(app);
      this.fb = { auth, fire, a, db };
      auth.onAuthStateChanged(a, async user => {
        this.user = user;
        if (this.unsubscribe) this.unsubscribe();
        if (user) {
          const ref = fire.doc(db, "brains", user.uid), snap = await fire.getDoc(ref);
          if (snap.exists()) this.data = normalize(snap.data().state);
          else await fire.setDoc(ref, { state: this.data, updatedAt: fire.serverTimestamp() });
          this.local();
          this.unsubscribe = fire.onSnapshot(ref, next => {
            if (next.exists()) { this.data = normalize(next.data().state); this.local(); render(); }
          });
        }
        render(); syncUI();
      });
    } catch (error) { console.warn(error); toast("동기화 연결을 확인해 주세요."); }
  }
  async signIn() { if (!this.fb) return syncModal(); await this.fb.auth.signInWithPopup(this.fb.a, new this.fb.auth.GoogleAuthProvider()); }
  async signOut() { if (this.fb) await this.fb.auth.signOut(this.fb.a); }
}

const store = new Store();
let workTab = "plan", assetTab = "dashboard", childTab = "overview", travelTab = "plan";
let calendarCursor = new Date(), ledgerMonth = currentMonth(), annualYear = currentYear, toastTimer;
const route = () => { const value = location.hash.replace(/^#\//, "").split("/")[0] || "home"; return NAV.some(item => item[0] === value) ? value : "home"; };

function nav(mobile = false) {
  const items = mobile ? [["home", "홈", "⌂"], ["work", "업무", "✓"], ["quick", "수집함", "＋"], ["assets", "자산", "₩"], ["annual", "연간", "▦"]] : NAV;
  return items.map(([key, label, icon]) => key === "quick"
    ? `<a href="#" data-do="quick"><em>${icon}</em>${label}</a>`
    : `<a class="${mobile ? "" : "nav"} ${route() === key ? "active" : ""}" href="#/${key}"><em>${icon}</em>${label}</a>`).join("");
}
function pageHead(title, copy, actions = "") {
  return `<header class="pageHead"><div><small>EUNJEONG BRAIN</small><h1>${title}</h1><p>${copy}</p></div><div class="actions">${actions}<button class="saveBtn" data-do="saveAll">저장</button></div></header>`;
}
function actionButtons(kind, itemId, extra = "") {
  return `<span class="rowActions"><button data-do="edit" data-kind="${kind}" data-id="${itemId}" ${extra}>수정</button><button class="deleteMini" data-do="delete" data-kind="${kind}" data-id="${itemId}" ${extra}>삭제</button></span>`;
}
function stat(label, value, copy, icon) { return `<article class="stat"><header><span>${label}</span><i class="ico">${icon}</i></header><b>${value}</b><small>${copy}</small></article>`; }
function empty(icon, text) { return `<div class="empty"><b>${icon}</b>${text}</div>`; }
function tag(type, text) { return `<span class="tag ${type}">${text}</span>`; }

function taskRows(items, limit = 99, sourceKind = "tasks") {
  if (!items.length) return empty("✓", "등록된 항목이 없어요.");
  return `<div class="tasks">${items.slice(0, limit).map(item => `<article class="task">
    <button class="check ${item.done ? "on" : ""}" data-do="toggle" data-kind="${sourceKind}" data-id="${item.id}">${item.done ? "✓" : ""}</button>
    <div><h3 class="${item.done ? "done" : ""}">${esc(item.title)}</h3><small>${displayDate(item.date || item.due)}${item.memo ? ` · ${esc(item.memo)}` : ""}</small></div>
    ${item.category === "work" ? tag(`work-${item.workType || "normal"}`, WORK_TYPES.find(x => x[0] === (item.workType || "normal"))?.[1] || "보통") : tag(item.category || "move", LABEL[item.category] || item.group || "항목")}
    ${actionButtons(sourceKind, item.id)}
  </article>`).join("")}</div>`;
}
function eventRows(items, limit = 99) {
  if (!items.length) return empty("◷", "등록된 일정이 없어요.");
  return `<div class="rows">${[...items].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, limit).map(item => {
    const d = new Date(`${item.date}T12:00:00`);
    return `<article class="row"><span class="date"><span><b>${d.getDate()}</b><small>${d.getMonth() + 1}월</small></span></span>
      <div class="rowCopy"><strong>${esc(item.title)}</strong><small>${item.time || "시간 미정"}${item.memo ? ` · ${esc(item.memo)}` : ""}</small></div>
      ${item.category === "work" ? tag(`work-${item.workType}`, WORK_TYPES.find(x => x[0] === item.workType)?.[1] || "보통") : tag(item.category, LABEL[item.category])}
      ${actionButtons("events", item.id)}
    </article>`;
  }).join("")}</div>`;
}

function homeView() {
  const open = store.data.tasks.filter(item => !item.done), todayCount = open.filter(item => item.date === iso()).length;
  const cardTotal = store.data.transactions.filter(item => item.date.startsWith(currentMonth()) && item.performanceIncluded).reduce((sum, item) => sum + n(item.amount), 0);
  return `${pageHead(`좋은 아침이에요, ${esc(store.data.profile.name)}님`, "오늘 해야 할 것과 가족의 흐름을 가볍게 정리해요.")}
  <section class="hero"><article class="capture"><p class="kicker">BRAIN INBOX</p><h2>생각나는 대로 적어 주세요.</h2><p>업무·육아·자산·여행·이사 메모를 내용에 맞게 분류해요.</p><form id="captureForm"><input name="text" placeholder="예: 금요일 이삿짐 견적 전화하기" required><button class="primary">Brain에 저장</button></form></article><article class="quote"><b>“</b><p>머릿속에서 꺼내 놓으면,<br>오늘은 조금 더 가벼워져요.</p><small>은정 Brain · 오늘의 한마디</small></article></section>
  <section class="stats">${stat("오늘 할 일", `${todayCount}개`, `${open.length}개 남아 있어요`, "✓")}${stat("다가오는 일정", `${store.data.events.filter(e => e.date >= iso()).length}개`, "가족·업무 일정", "◷")}${stat("카드 인정실적", won(cardTotal), "이번 달 합계", "₩")}${stat("여행 계획", `${store.data.trips.filter(t => t.type === "plan").length}개`, "준비 중인 여행", "✈")}</section>
  <section class="grid2"><article class="panel"><header class="panelHead"><div><h2>지금 해야 할 일</h2><p>수정·삭제 후 자동 동기화됩니다</p></div><button class="textBtn" data-do="task">할 일 추가</button></header><div class="panelBody">${taskRows([...store.data.tasks].sort((a, b) => a.done - b.done || (a.date || "").localeCompare(b.date || "")), 6)}</div></article><article class="panel"><header class="panelHead"><div><h2>다가오는 일정</h2><p>가까운 일정부터 보여드려요</p></div><button class="textBtn" data-do="event">일정 추가</button></header><div class="panelBody">${eventRows(store.data.events.filter(e => e.date >= iso()), 5)}</div></article></section>`;
}

function workView() {
  const workTasks = store.data.tasks.filter(item => item.category === "work"), workEvents = store.data.events.filter(item => item.category === "work");
  const body = workTab === "plan"
    ? `<section class="grid2"><article class="panel"><header class="panelHead"><div><h2>업무계획</h2><p>BR·DD·중요·보통으로 구분해요</p></div><button class="primary" data-do="task" data-cat="work">＋ 업무</button></header><div class="panelBody">${taskRows(workTasks)}</div></article><article class="panel"><header class="panelHead"><div><h2>업무 일정</h2><p>달력에 표시될 일정</p></div><button class="primary" data-do="event" data-cat="work">＋ 일정</button></header><div class="panelBody">${eventRows(workEvents, 8)}</div></article></section>`
    : calendar([...workTasks, ...workEvents]);
  return `${pageHead("업무", "업무계획과 색상 달력에 집중해서 관리해요.", `<button class="secondary" data-do="event" data-cat="work">＋ 일정</button><button class="primary" data-do="task" data-cat="work">＋ 업무</button>`)}
    <div class="calendarLegend">${WORK_TYPES.map(([type, label]) => `<span class="work-${type}">${label}</span>`).join("")}</div>
    <div class="tabs">${[["plan", "업무계획"], ["calendar", "업무달력"]].map(([key, label]) => `<button class="${workTab === key ? "on" : ""}" data-do="workTab" data-tab="${key}">${label}</button>`).join("")}</div>${body}`;
}
function calendar(items) {
  const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth(), first = new Date(year, month, 1), start = new Date(year, month, 1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start); day.setDate(start.getDate() + index); const dateKey = day.toISOString().slice(0, 10);
    const dayItems = items.filter(item => (item.date || item.due) === dateKey);
    return `<div class="day ${day.getMonth() !== month ? "out" : ""} ${dateKey === iso() ? "today" : ""}"><button class="num" data-do="addOnDate" data-date="${dateKey}">${day.getDate()}</button>
      ${dayItems.slice(0, 5).map(item => `<button class="calItem work-${item.workType || "normal"}" data-do="edit" data-kind="${item.time !== undefined ? "events" : "tasks"}" data-id="${item.id}">${esc(item.title)}</button>`).join("")}</div>`;
  }).join("");
  return `<article class="panel"><header class="panelHead"><div><h2>${year}년 ${month + 1}월</h2><p>날짜나 일정을 누르면 바로 입력·수정할 수 있어요</p></div><div class="rowActions"><button data-do="calendarPrev">‹ 이전</button><button data-do="calendarToday">오늘</button><button data-do="calendarNext">다음 ›</button></div></header><div class="panelBody calendarWrap"><div class="calendar"><div class="week">${["일", "월", "화", "수", "목", "금", "토"].map(x => `<span>${x}</span>`).join("")}</div><div class="days">${days}</div></div></div></article>`;
}

function annualView() {
  const plans = store.data.annualPlans.filter(item => n(item.year) === n(annualYear));
  return `${pageHead("연간계획", "월별 계획을 업무·가족·도담·소담·자산로 나눠 길게 봅니다.", `<button class="primary" data-do="annualItem">＋ 계획</button>`)}
    <div class="yearPicker"><button data-do="annualPrev">‹</button><strong>${annualYear}년</strong><button data-do="annualNext">›</button></div>
    <div class="annualWrap"><table class="annualTable"><thead><tr><th>구분</th>${Array.from({ length: 12 }, (_, i) => `<th>${i + 1}월</th>`).join("")}</tr></thead><tbody>
    ${PLAN_ROWS.map(([row, label]) => `<tr><th>${label}</th>${Array.from({ length: 12 }, (_, i) => {
      const monthPlans = plans.filter(item => item.row === row && n(item.month) === i + 1);
      return `<td><button class="cellAdd" data-do="annualCell" data-row="${row}" data-month="${i + 1}">＋</button>${monthPlans.map(item => `<article class="planChip row-${row}"><strong>${esc(item.title)}</strong>${item.memo ? `<small>${esc(item.memo)}</small>` : ""}${actionButtons("annualPlans", item.id)}</article>`).join("")}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function parentingView() {
  const buttons = [["overview", "전체"], ["dodam", "도담"], ["sodam", "소담"]].map(([key, label]) => `<button class="${childTab === key ? "on" : ""}" data-do="childTab" data-tab="${key}">${label}</button>`).join("");
  const content = childTab === "overview" ? childOverview() : childDetail(childTab);
  return `${pageHead("도담·소담", "각각 매일 루틴시간표·연간로드맵·성장로드맵으로 관리해요.")}<div class="tabs">${buttons}</div>${content}`;
}
function childOverview() {
  return `<section class="people"><article class="person dodam"><span class="avatar">📚</span><h3>도담</h3><p>초등 1학년<br>독서 · 사고력수학 · 영어 · 줄넘기</p><button class="primary space" data-do="openChild" data-child="dodam">도담 관리</button></article><article class="person sodam"><span class="avatar">🌼</span><h3>소담</h3><p>5세<br>그림책 · 놀이수학 · 한글 · 신체활동</p><button class="primary space" data-do="openChild" data-child="sodam">소담 관리</button></article><article class="person"><span class="avatar">🗓</span><h3>가족 일정</h3><p>학교·유치원·학원·체험학습 일정을 모아요.</p><button class="primary space" data-do="event" data-cat="parenting">일정 추가</button></article></section><article class="panel space"><header class="panelHead"><div><h2>다가오는 아이 일정</h2><p>도담·소담 일정 모아보기</p></div></header><div class="panelBody">${eventRows(store.data.events.filter(e => e.category === "parenting"))}</div></article>`;
}
function childDetail(child) {
  const name = child === "dodam" ? "도담" : "소담", data = store.data.childData[child];
  return `<section class="childColumns">
    <article class="panel"><header class="panelHead"><div><h2>매일 루틴시간표</h2><p>시간·요일별 생활 루틴</p></div><button class="textBtn" data-do="childItem" data-child="${child}" data-section="routines">＋ 추가</button></header><div class="panelBody">${childRows(data.routines, child, "routines")}</div></article>
    <article class="panel"><header class="panelHead"><div><h2>연간 로드맵</h2><p>학년·연도별 큰 계획</p></div><button class="textBtn" data-do="childItem" data-child="${child}" data-section="annual">＋ 추가</button></header><div class="panelBody">${childRows(data.annual, child, "annual")}</div></article>
    <article class="panel"><header class="panelHead"><div><h2>성장 로드맵</h2><p>학습·생활·정서·운동 성장</p></div><button class="textBtn" data-do="childItem" data-child="${child}" data-section="growth">＋ 추가</button></header><div class="panelBody">${childRows(data.growth, child, "growth")}</div></article>
  </section><p class="roadmapNote">${name}의 로드맵은 ‘매일 반복하는 것 → 올해 이루고 싶은 것 → 장기적으로 키우고 싶은 힘’ 순서로 연결됩니다.</p>`;
}
function childRows(items, child, section) {
  if (!items.length) return empty("♧", "첫 항목을 추가해 보세요.");
  return `<div class="rows">${items.map(item => {
    const title = section === "routines" ? `${item.time} · ${item.title}` : section === "annual" ? `${item.year} ${item.period} · ${item.title}` : `${item.area} · ${item.target}`;
    const sub = section === "routines" ? item.days : section === "growth" ? `진행 ${item.progress}%` : item.memo;
    return `<article class="row"><div class="rowCopy"><strong>${esc(title)}</strong><small>${esc(sub || item.memo || "")}</small></div>${actionButtons("childItem", item.id, `data-child="${child}" data-section="${section}"`)}</article>`;
  }).join("")}</div>`;
}

function assetSummary() {
  const liquid = store.data.accounts.filter(item => item.type !== "debt").reduce((sum, item) => sum + n(item.amount), 0);
  const property = store.data.properties.reduce((sum, item) => sum + n(item.currentValue), 0);
  const stocks = store.data.stocks.reduce((sum, item) => sum + n(item.shares) * n(item.currentPrice || item.avgPrice), 0);
  const debt = store.data.loans.reduce((sum, item) => sum + n(item.amount), 0) + store.data.installments.reduce((sum, item) => sum + n(item.balance), 0);
  const monthTx = store.data.transactions.filter(item => item.date.startsWith(ledgerMonth));
  const income = monthTx.filter(item => item.kind === "income").reduce((sum, item) => sum + n(item.amount), 0);
  const expense = monthTx.filter(item => item.kind === "expense").reduce((sum, item) => sum + n(item.amount), 0);
  return { liquid, property, stocks, debt, asset: liquid + property + stocks, net: liquid + property + stocks - debt, income, expense };
}
function assetsView() {
  const tabs = [["dashboard", "자산 대시보드"], ["ledger", "월별 가계부"], ["cards", "카드 실적"], ["manage", "자산관리"]]
    .map(([key, label]) => `<button class="${assetTab === key ? "on" : ""}" data-do="assetTab" data-tab="${key}">${label}</button>`).join("");
  const content = assetTab === "dashboard" ? assetDashboard() : assetTab === "ledger" ? ledgerView() : assetTab === "cards" ? cardView() : assetManage();
  return `${pageHead("자산", "카드실적·월별 가계부·자산 상세현황을 자동 계산해요.", `<button class="primary" data-do="transaction">＋ 사용내역</button>`)}<div class="tabs">${tabs}</div>${content}`;
}
function assetDashboard() {
  const s = assetSummary();
  return `<section class="assetHero"><article class="total"><small>기타현황을 제외한 순자산</small><strong>${won(s.net)}</strong><div class="breakdown"><div><small>총자산</small><b>${won(s.asset)}</b></div><div><small>대출·할부</small><b>${won(s.debt)}</b></div><div><small>${ledgerMonth} 잔액</small><b>${won(s.income - s.expense)}</b></div></div></article><article class="insight"><h3>✦ 월별 가계 흐름</h3><p>수입 ${won(s.income)} · 지출 ${won(s.expense)}<br>이번 달 가계 잔액은 ${won(s.income - s.expense)}입니다.</p></article></section>
  <section class="stats">${stat("현금·예금", won(s.liquid), "입력계좌 합계", "₩")}${stat("주식", won(s.stocks), "현재가 기준", "↗")}${stat("부동산", won(s.property), "현재시세 기준", "⌂")}${stat("부채", won(s.debt), "대출+할부 잔액", "−")}</section>
  ${cardPerformance(true)}
  <section class="grid2 space"><article class="panel"><header class="panelHead"><div><h2>최근 가계부</h2><p>수입·지출·카드실적 반영</p></div><button class="textBtn" data-do="transaction">＋ 내역</button></header><div class="panelBody">${transactionRows([...store.data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6))}</div></article><article class="panel"><header class="panelHead"><div><h2>자산관리 요약</h2><p>상세현황 항목 수</p></div></header><div class="panelBody assetCounts">${Object.entries(ASSET_SECTIONS).map(([key, label]) => `<button data-do="assetSection" data-section="${key}"><b>${store.data[key].length}</b><span>${label}</span></button>`).join("")}</div></article></section>`;
}
function cardPerformance(compact = false) {
  const monthItems = store.data.transactions.filter(item => item.date.startsWith(ledgerMonth) && item.kind === "expense" && item.performanceIncluded);
  return `<section class="cardGrid ${compact ? "space" : ""}">${store.data.cards.map(card => {
    const used = monthItems.filter(item => item.card === card.name).reduce((sum, item) => sum + n(item.amount), 0);
    const target = n(card.target), remain = Math.max(target - used, 0), rate = target ? Math.min(used / target * 100, 100) : 0;
    return `<article class="cardPerformance"><header><div><small>${ledgerMonth}</small><h3>${esc(card.name)}</h3></div>${actionButtons("cards", card.id)}</header><strong>${won(used)}</strong><p>${target ? remain ? `실적까지 ${won(remain)} 더 필요` : "목표 실적 달성!" : "목표실적을 입력해 주세요"}</p><div class="progress"><i style="width:${rate}%"></i></div><small>${target ? `${won(used)} / ${won(target)}` : "목표 없음"}</small></article>`;
  }).join("")}</section>`;
}
function ledgerView() {
  const items = store.data.transactions.filter(item => item.date.startsWith(ledgerMonth)).sort((a, b) => b.date.localeCompare(a.date)), s = assetSummary();
  return `<div class="monthPicker"><button data-do="ledgerPrev">‹</button><strong>${ledgerMonth.replace("-", "년 ")}월</strong><button data-do="ledgerNext">›</button></div>
  <section class="stats">${stat("수입", won(s.income), "월 수입 합계", "+")}${stat("지출", won(s.expense), "월 지출 합계", "−")}${stat("잔액", won(s.income - s.expense), "수입-지출", "₩")}${stat("실적 포함", won(items.filter(x => x.performanceIncluded).reduce((sum, x) => sum + n(x.amount), 0)), "카드 인정금액", "✓")}</section>
  <article class="panel"><header class="panelHead"><div><h2>${ledgerMonth} 가계부</h2><p>카드와 실적 포함 여부까지 기록합니다</p></div><button class="primary" data-do="transaction">＋ 사용내역</button></header><div class="panelBody">${transactionRows(items)}</div></article>`;
}
function transactionRows(items) {
  if (!items.length) return empty("₩", "첫 가계부 내역을 입력해 보세요.");
  return `<div class="rows">${items.map(item => `<article class="row"><i class="ico">${item.kind === "income" ? "+" : "−"}</i><div class="rowCopy"><strong>${esc(item.title)}</strong><small>${item.date} · ${esc(item.category)} · ${esc(item.card || "현금/계좌")} ${item.performanceIncluded ? "· 실적포함" : "· 실적미포함"}</small></div><span class="amount ${item.kind}">${item.kind === "income" ? "+" : "−"}${won(item.amount)}</span>${actionButtons("transactions", item.id)}</article>`).join("")}</div>`;
}
function cardView() {
  return `<div class="monthPicker"><button data-do="ledgerPrev">‹</button><strong>${ledgerMonth.replace("-", "년 ")}월 카드실적</strong><button data-do="ledgerNext">›</button></div>${cardPerformance()}<article class="panel space"><header class="panelHead"><div><h2>실적 포함 사용내역</h2><p>실적미포함은 합계에서 제외됩니다</p></div><button class="primary" data-do="transaction">＋ 사용내역</button></header><div class="panelBody">${transactionRows(store.data.transactions.filter(item => item.date.startsWith(ledgerMonth) && item.performanceIncluded))}</div></article>`;
}
function assetManage() {
  return `<section class="assetManageGrid">${Object.entries(ASSET_SECTIONS).map(([key, label]) => `<article class="panel"><header class="panelHead"><div><h2>${label}</h2><p>${key === "otherAssets" ? "순자산 대시보드에서 제외" : assetSectionHint(key)}</p></div><button class="textBtn" data-do="assetItem" data-section="${key}">＋ 추가</button></header><div class="panelBody">${assetRows(key)}</div></article>`).join("")}</section>`;
}
function assetSectionHint(key) {
  return {
    accounts: "계좌·현금성 자산", loans: "금액·만기·금리·이자", insurances: "대상자·보험료·예상수령액",
    stocks: "종목·주수·평단가·수익률", installments: "카드·항목·개월수·잔액", properties: "구매가·현재시세"
  }[key] || "세부현황";
}
function assetRows(section) {
  const items = store.data[section];
  if (!items.length) return empty("＋", `${ASSET_SECTIONS[section]}을 입력해 보세요.`);
  return `<div class="rows">${items.map(item => `<article class="row"><div class="rowCopy"><strong>${esc(assetItemTitle(section, item))}</strong><small>${esc(assetItemSub(section, item))}</small></div>${actionButtons(section, item.id)}</article>`).join("")}</div>`;
}
function assetItemTitle(section, item) {
  return {
    accounts: `${item.name} · ${won(item.amount)}`, loans: `${item.name} · ${won(item.amount)}`, insurances: `${item.name} · ${item.person}`,
    stocks: `${item.name} · ${item.shares}주`, otherAssets: `${item.name} · ${won(item.amount)}`, installments: `${item.card} · ${item.item}`,
    properties: `${item.name} · 현재 ${won(item.currentValue)}`
  }[section];
}
function assetItemSub(section, item) {
  return {
    accounts: item.memo || item.type, loans: `만기 ${item.due || "-"} · 금리 ${pct(item.rate)} · 월이자 ${won(item.interestAmount)}`,
    insurances: `보험료 ${won(item.premium)} · 만기 ${item.due || "-"} · 예상수령 ${won(item.expected)}`,
    stocks: `평단 ${won(item.avgPrice)} · 현재 ${won(item.currentPrice)} · 수익률 ${pct(stockRate(item))}`,
    otherAssets: `${item.type || "가족대출"} · 대시보드 제외`, installments: `${item.months}개월 · 만료 ${item.due || "-"} · 잔액 ${won(item.balance)}`,
    properties: `구매 ${won(item.purchasePrice)} · 대출 ${won(item.loan)} · ${item.memo || ""}`
  }[section];
}
function stockRate(item) { return n(item.avgPrice) ? (n(item.currentPrice) - n(item.avgPrice)) / n(item.avgPrice) * 100 : 0; }

function travelView() {
  const items = store.data.trips.filter(item => item.type === travelTab).sort((a, b) => (b.start || "").localeCompare(a.start || ""));
  return `${pageHead("여행", "가고 싶은 여행은 계획으로, 다녀온 여행은 기록으로 남겨요.", `<button class="primary" data-do="trip" data-type="${travelTab}">＋ 여행</button>`)}
  <div class="tabs"><button class="${travelTab === "plan" ? "on" : ""}" data-do="travelTab" data-tab="plan">여행 계획</button><button class="${travelTab === "record" ? "on" : ""}" data-do="travelTab" data-tab="record">여행 기록</button></div>
  <section class="tripGrid">${items.length ? items.map(item => `<article class="tripCard"><header><span>${item.type === "plan" ? "계획" : "기록"}</span>${actionButtons("trips", item.id)}</header><h3>${esc(item.title)}</h3><p>📍 ${esc(item.destination)}<br>🗓 ${item.start || "-"} ~ ${item.end || "-"}<br>₩ ${won(item.budget)}</p>${item.memo ? `<small>${esc(item.memo)}</small>` : ""}</article>`).join("") : empty("✈", "첫 여행을 추가해 보세요.")}</section>`;
}

function moveView() {
  const done = store.data.moveItems.filter(item => item.done).length, rate = Math.round(done / Math.max(store.data.moveItems.length, 1) * 100);
  const mapped = store.data.moveItems.map(item => ({ ...item, category: "move", date: item.due }));
  const totalCost = store.data.moveItems.reduce((sum, item) => sum + n(item.cost), 0);
  return `${pageHead("부동산·이사", "수리·견적·구매·처분·이전신청과 부동산 현황을 함께 관리해요.", `<button class="primary" data-do="moveItem">＋ 이사계획</button>`)}
  <section class="stats">${stat("진행률", `${rate}%`, `${done}/${mapped.length} 완료`, "✓")}${stat("예상비용", won(totalCost), "이사계획 합계", "₩")}${stat("목표일", "2027.03.06", "전세 만기·이사", "◷")}${stat("부동산", `${store.data.properties.length}건`, "자산현황과 연결", "⌂")}</section>
  <section class="grid2"><article class="panel"><header class="panelHead"><div><h2>이사계획</h2><p>그룹·기한·예상비용·메모</p></div><button class="textBtn" data-do="moveItem">＋ 추가</button></header><div class="panelBody">${taskRows(mapped, 99, "moveItems")}</div></article><article class="panel"><header class="panelHead"><div><h2>부동산 현황</h2><p>구매가·현재시세·대출</p></div><button class="textBtn" data-do="assetItem" data-section="properties">＋ 추가</button></header><div class="panelBody">${assetRows("properties")}</div></article></section>`;
}

function growthView() {
  return `${pageHead("자기계발", "배우고 싶은 것과 업무 자동화 아이디어를 진전으로 바꿔요.", `<button class="primary" data-do="simpleItem" data-section="growth">＋ 성장목표</button>`)}${progressCards(store.data.growth, "growth")}`;
}
function goalsView() {
  return `${pageHead("목표관리", "가족·개인 목표의 진척도를 확인해요.", `<button class="primary" data-do="simpleItem" data-section="goals">＋ 목표</button>`)}${progressCards(store.data.goals, "goals")}`;
}
function progressCards(items, kind) {
  return `<section class="goals">${items.length ? items.map(item => `<article class="goal"><header><h3>${esc(item.title)}</h3><b>${item.progress}%</b></header><p>${kind === "goals" ? `${esc(item.group)} · ${item.due}` : esc(item.memo || "조금씩 꾸준히 쌓아가는 중")}</p><div class="progress"><i style="width:${Math.min(item.progress, 100)}%"></i></div>${actionButtons(kind, item.id)}</article>`).join("") : empty("◎", "첫 목표를 추가해 보세요.")}</section>`;
}

function render() {
  $("#sideNav").innerHTML = nav(false); $("#bottomNav").innerHTML = nav(true);
  $("#app").innerHTML = ({ home: homeView, work: workView, annual: annualView, parenting: parentingView, assets: assetsView, travel: travelView, move: moveView, growth: growthView, goals: goalsView }[route()] || homeView)();
  syncUI(); window.scrollTo(0, 0);
}

function infer(text) {
  const value = text.toLowerCase(); let category = "work";
  if (/도담|소담|학교|유치원|학원|숙제|줄넘기/.test(value)) category = "parenting";
  else if (/여행|숙소|항공|호텔|박물관/.test(value)) category = "travel";
  else if (/원|결제|카드|보험|대출|예금|주식|가계부/.test(value)) category = "assets";
  else if (/이사|수리|샤시|도배|장판|전세|재건축|가구/.test(value)) category = "move";
  else if (/공부|강의|배우|코딩|프롬프트/.test(value)) category = "growth";
  else if (/목표|버킷/.test(value)) category = "goals";
  return { category, date: /모레/.test(value) ? iso(2) : /내일/.test(value) ? iso(1) : iso() };
}
function capture(text) {
  const result = infer(text);
  store.data.inbox.unshift({ id: makeId(), text, ...result, createdAt: new Date().toISOString() });
  store.data.tasks.unshift({ id: makeId(), title: text, category: result.category, date: result.date, priority: "normal", workType: "normal", done: false, memo: "" });
  store.save("Brain에 저장했어요."); render();
}

function modal(title, html) {
  $("#modalTitle").textContent = title; $("#modalBody").innerHTML = html; $("#backdrop").hidden = false; document.body.style.overflow = "hidden";
  setTimeout(() => $("#modalBody input, #modalBody textarea")?.focus(), 30);
}
function closeModal() { $("#backdrop").hidden = true; document.body.style.overflow = ""; }
function field(name, label, type = "text", value = "", options = {}) {
  const full = options.full ? "full" : "";
  if (type === "select") return `<div class="field ${full}"><label>${label}</label><select name="${name}">${options.items.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
  if (type === "textarea") return `<div class="field ${full}"><label>${label}</label><textarea name="${name}" ${options.required === false ? "" : "required"}>${esc(value)}</textarea></div>`;
  if (type === "checkbox") return `<label class="checkField"><input name="${name}" type="checkbox" ${value ? "checked" : ""}> ${label}</label>`;
  return `<div class="field ${full}"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${options.min != null ? `min="${options.min}"` : ""} ${options.step ? `step="${options.step}"` : ""} ${options.required === false ? "" : "required"}></div>`;
}
function form(formId, fields, edit = {}) {
  return `<form id="${formId}" data-edit-id="${edit.id || ""}" ${edit.extra || ""}><div class="formGrid">${fields}</div><div class="buttons"><button type="button" class="ghost" data-do="close">취소</button><button class="primary">저장</button></div></form>`;
}
function findItem(kind, itemId, child, section) {
  if (kind === "childItem") return store.data.childData[child][section].find(item => item.id === itemId);
  return store.data[kind]?.find(item => item.id === itemId);
}
function upsert(list, item, editId) {
  const index = list.findIndex(value => value.id === editId);
  if (index >= 0) list[index] = { ...list[index], ...item, id: editId };
  else list.unshift({ ...item, id: makeId() });
}

function taskModal(item = {}, category = "work", presetDate = "") {
  modal(item.id ? "할 일 수정" : "새 할 일", form("taskForm",
    field("title", "할 일", "text", item.title || "", { full: true }) +
    field("category", "카테고리", "select", item.category || category, { items: NAV.filter(x => !["home", "annual"].includes(x[0])).map(x => [x[0], x[1]]) }) +
    field("date", "마감일", "date", item.date || presetDate || iso()) +
    field("workType", "업무 색상", "select", item.workType || "normal", { items: WORK_TYPES }) +
    field("memo", "메모", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function eventModal(item = {}, category = "work", presetDate = "") {
  modal(item.id ? "일정 수정" : "새 일정", form("eventForm",
    field("title", "일정 이름", "text", item.title || "", { full: true }) +
    field("category", "카테고리", "select", item.category || category, { items: NAV.filter(x => !["home", "annual"].includes(x[0])).map(x => [x[0], x[1]]) }) +
    field("date", "날짜", "date", item.date || presetDate || iso()) +
    field("time", "시간", "time", item.time || "09:00") +
    field("workType", "업무 색상", "select", item.workType || "normal", { items: WORK_TYPES }) +
    field("memo", "메모", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function transactionModal(item = {}) {
  const cardOptions = [["현금/계좌", "현금/계좌"], ...store.data.cards.map(card => [card.name, card.name])];
  modal(item.id ? "사용내역 수정" : "가계부 사용내역", form("transactionForm",
    field("title", "내용", "text", item.title || "", { full: true }) +
    field("kind", "구분", "select", item.kind || "expense", { items: [["expense", "지출"], ["income", "수입"]] }) +
    field("category", "분류", "select", item.category || "생활비", { items: ["생활비", "교육", "주거", "보험", "교통", "여행", "급여", "기타"].map(v => [v, v]) }) +
    field("amount", "금액", "number", item.amount || "", { min: 0 }) +
    field("date", "날짜", "date", item.date || iso()) +
    field("card", "결제수단", "select", item.card || "현금/계좌", { items: cardOptions }) +
    field("performanceIncluded", "카드 실적 포함", "select", item.performanceIncluded ? "yes" : "no", { items: [["yes", "실적 포함"], ["no", "실적 미포함"]] }) +
    field("memo", "메모", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function annualModal(item = {}, row = "work", month = new Date().getMonth() + 1) {
  modal(item.id ? "연간계획 수정" : "연간계획 추가", form("annualForm",
    field("year", "연도", "number", item.year || annualYear) +
    field("month", "월", "select", item.month || month, { items: Array.from({ length: 12 }, (_, i) => [String(i + 1), `${i + 1}월`]) }) +
    field("row", "구분", "select", item.row || row, { items: PLAN_ROWS }) +
    field("title", "계획", "text", item.title || "", { full: true }) +
    field("memo", "메모", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function childModal(child, section, item = {}) {
  let fields = "";
  if (section === "routines") fields = field("time", "시간", "time", item.time || "07:00") + field("days", "요일", "text", item.days || "매일") + field("title", "루틴", "text", item.title || "", { full: true }) + field("memo", "메모", "textarea", item.memo || "", { full: true, required: false });
  if (section === "annual") fields = field("year", "연도", "number", item.year || currentYear) + field("period", "기간", "select", item.period || "연간", { items: [["연간", "연간"], ["상반기", "상반기"], ["하반기", "하반기"], ["1학기", "1학기"], ["2학기", "2학기"]] }) + field("title", "로드맵", "text", item.title || "", { full: true }) + field("memo", "메모", "textarea", item.memo || "", { full: true, required: false });
  if (section === "growth") fields = field("area", "영역", "select", item.area || "학습", { items: ["학습", "생활", "정서", "운동", "사회성", "건강"].map(v => [v, v]) }) + field("progress", "진행률", "number", item.progress || 0, { min: 0 }) + field("target", "성장 목표", "text", item.target || "", { full: true }) + field("memo", "메모", "textarea", item.memo || "", { full: true, required: false });
  modal(`${child === "dodam" ? "도담" : "소담"} ${section === "routines" ? "루틴" : section === "annual" ? "연간로드맵" : "성장로드맵"} ${item.id ? "수정" : "추가"}`, form("childForm", fields, { id: item.id, extra: `data-child="${child}" data-section="${section}"` }));
}
function tripModal(item = {}, type = "plan") {
  modal(item.id ? "여행 수정" : "여행 추가", form("tripForm",
    field("type", "구분", "select", item.type || type, { items: [["plan", "여행 계획"], ["record", "여행 기록"]] }) +
    field("destination", "여행지", "text", item.destination || "") +
    field("title", "여행 이름", "text", item.title || "", { full: true }) +
    field("start", "시작일", "date", item.start || iso()) + field("end", "종료일", "date", item.end || iso()) +
    field("budget", "예산/사용금액", "number", item.budget || 0, { min: 0 }) +
    field("memo", "계획·기록", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function moveModal(item = {}) {
  modal(item.id ? "이사계획 수정" : "이사계획 추가", form("moveForm",
    field("title", "항목", "text", item.title || "", { full: true }) +
    field("group", "구분", "select", item.group || "이사", { items: ["수리", "이사", "구매", "처분", "이전신청", "행정"].map(v => [v, v]) }) +
    field("due", "기한", "date", item.due || "2027-03-06") +
    field("cost", "예상비용", "number", item.cost || 0, { min: 0 }) +
    field("memo", "메모", "textarea", item.memo || "", { full: true, required: false }),
    { id: item.id }
  ));
}
function cardModal(item = {}) {
  modal(item.id ? "카드 수정" : "카드 추가", form("cardForm", field("name", "카드명", "text", item.name || "") + field("target", "월 목표실적", "number", item.target || 0, { min: 0 }), { id: item.id }));
}
function assetModal(section, item = {}) {
  const memo = field("memo", "메모", "textarea", item.memo || "", { full: true, required: false });
  let fields = "";
  if (section === "accounts") fields = field("name", "계좌/자산명", "text", item.name || "") + field("type", "종류", "select", item.type || "cash", { items: [["cash", "현금·예금"], ["investment", "연금·기타"]] }) + field("amount", "금액", "number", item.amount || 0, { min: 0 }) + memo;
  if (section === "loans") fields = field("name", "대출명", "text", item.name || "") + field("amount", "대출금액", "number", item.amount || 0, { min: 0 }) + field("due", "만기일", "date", item.due || iso()) + field("rate", "이자율(%)", "number", item.rate || 0, { min: 0, step: "0.01" }) + field("interestAmount", "월 이자금액", "number", item.interestAmount || 0, { min: 0 }) + field("interestMemo", "이자/상환방식", "text", item.interestMemo || "", { full: true }) + memo;
  if (section === "insurances") fields = field("name", "보험명", "text", item.name || "") + field("person", "대상자", "text", item.person || "") + field("premium", "보험료", "number", item.premium || 0, { min: 0 }) + field("due", "만기일", "date", item.due || iso()) + field("expected", "예상수령액", "number", item.expected || 0, { min: 0 }) + memo;
  if (section === "stocks") fields = field("name", "종목", "text", item.name || "") + field("shares", "주", "number", item.shares || 0, { min: 0, step: "0.0001" }) + field("avgPrice", "평단가", "number", item.avgPrice || 0, { min: 0 }) + field("currentPrice", "현재가", "number", item.currentPrice || 0, { min: 0 }) + memo;
  if (section === "otherAssets") fields = field("name", "항목", "text", item.name || "가족대출") + field("type", "종류", "text", item.type || "가족대출") + field("amount", "금액", "number", item.amount || 0, { min: 0 }) + memo;
  if (section === "installments") fields = field("card", "카드", "text", item.card || "") + field("item", "항목", "text", item.item || "") + field("due", "만료일", "date", item.due || iso()) + field("months", "개월수", "number", item.months || 0, { min: 0 }) + field("balance", "잔액", "number", item.balance || 0, { min: 0 }) + memo;
  if (section === "properties") fields = field("name", "부동산명", "text", item.name || "") + field("purchasePrice", "구매가", "number", item.purchasePrice || 0, { min: 0 }) + field("currentValue", "현재시세", "number", item.currentValue || 0, { min: 0 }) + field("loan", "관련대출", "number", item.loan || 0, { min: 0 }) + field("purchaseDate", "구매일", "date", item.purchaseDate || iso()) + memo;
  modal(`${ASSET_SECTIONS[section]} ${item.id ? "수정" : "추가"}`, form("assetForm", fields, { id: item.id, extra: `data-section="${section}"` }));
}
function simpleModal(section, item = {}) {
  const fields = section === "growth"
    ? field("title", "성장목표", "text", item.title || "", { full: true }) + field("progress", "진행률", "number", item.progress || 0, { min: 0 }) + field("memo", "메모", "textarea", item.memo || "", { full: true, required: false })
    : field("title", "목표", "text", item.title || "", { full: true }) + field("group", "분류", "text", item.group || "가족") + field("due", "목표일", "date", item.due || iso(90)) + field("progress", "진행률", "number", item.progress || 0, { min: 0 }) + field("memo", "메모", "textarea", item.memo || "", { full: true, required: false });
  modal(item.id ? "항목 수정" : "항목 추가", form("simpleForm", fields, { id: item.id, extra: `data-section="${section}"` }));
}
function quickModal() {
  modal("Brain 빠른 수집", `<form id="quickForm"><div class="field"><label>생각나는 내용을 그대로 적어 주세요</label><textarea name="text" required></textarea></div><div class="buttons"><button type="button" class="ghost" data-do="close">취소</button><button class="primary">저장</button></div></form>`);
}
function syncModal() {
  const configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId), online = !!store.user;
  modal("PC·모바일 동기화", `<div class="syncInfo"><h3>${online ? "✓ Google 계정으로 연결됨" : configured ? "동기화 준비 완료" : "이 기기에 저장 중"}</h3><p>${online ? `${esc(store.user.email || "로그인 계정")} 데이터가 자동 동기화됩니다.` : "같은 Google 계정으로 로그인하면 모든 기기에서 같은 데이터가 보입니다."}</p></div><div class="buttons">${online ? `<button class="danger" data-do="signOut">로그아웃</button>` : configured ? `<button class="primary" data-do="signIn">Google로 연결하기</button>` : ""}<button class="ghost" data-do="close">닫기</button></div>`);
}
function syncUI() {
  const online = !!store.user; $("#syncDot")?.classList.toggle("on", online);
  if ($("#syncTitle")) $("#syncTitle").textContent = online ? "PC·모바일 동기화 중" : "이 기기에 저장 중";
  if ($("#syncText")) $("#syncText").textContent = online ? (store.user.email || "Google 계정") : "PC·모바일 연결 설정";
}
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2300); }

document.addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target).entries()), editId = event.target.dataset.editId;
  if (["captureForm", "quickForm"].includes(event.target.id)) { capture(data.text); closeModal(); return; }
  if (event.target.id === "taskForm") upsert(store.data.tasks, { title: data.title, category: data.category, date: data.date, workType: data.workType, priority: data.workType === "important" ? "high" : "normal", memo: data.memo, done: editId ? findItem("tasks", editId)?.done : false }, editId);
  if (event.target.id === "eventForm") upsert(store.data.events, { title: data.title, category: data.category, date: data.date, time: data.time, workType: data.workType, memo: data.memo }, editId);
  if (event.target.id === "transactionForm") upsert(store.data.transactions, { title: data.title, kind: data.kind, category: data.category, amount: n(data.amount), date: data.date, card: data.card, performanceIncluded: data.performanceIncluded === "yes", memo: data.memo }, editId);
  if (event.target.id === "annualForm") upsert(store.data.annualPlans, { year: n(data.year), month: n(data.month), row: data.row, title: data.title, memo: data.memo }, editId);
  if (event.target.id === "childForm") {
    const list = store.data.childData[event.target.dataset.child][event.target.dataset.section];
    const section = event.target.dataset.section;
    const item = section === "routines" ? { time: data.time, days: data.days, title: data.title, memo: data.memo } : section === "annual" ? { year: n(data.year), period: data.period, title: data.title, memo: data.memo } : { area: data.area, progress: Math.min(100, n(data.progress)), target: data.target, memo: data.memo };
    upsert(list, item, editId);
  }
  if (event.target.id === "tripForm") upsert(store.data.trips, { type: data.type, title: data.title, destination: data.destination, start: data.start, end: data.end, budget: n(data.budget), memo: data.memo }, editId);
  if (event.target.id === "moveForm") upsert(store.data.moveItems, { title: data.title, group: data.group, due: data.due, cost: n(data.cost), memo: data.memo, done: editId ? findItem("moveItems", editId)?.done : false }, editId);
  if (event.target.id === "cardForm") {
    const oldName = editId ? findItem("cards", editId)?.name : "";
    if (oldName && oldName !== data.name) store.data.transactions.forEach(item => { if (item.card === oldName) item.card = data.name; });
    upsert(store.data.cards, { name: data.name, target: n(data.target) }, editId);
  }
  if (event.target.id === "assetForm") {
    const section = event.target.dataset.section, item = { ...data };
    ["amount", "rate", "interestAmount", "premium", "expected", "shares", "avgPrice", "currentPrice", "months", "balance", "purchasePrice", "currentValue", "loan"].forEach(key => { if (key in item) item[key] = n(item[key]); });
    upsert(store.data[section], item, editId);
  }
  if (event.target.id === "simpleForm") {
    const section = event.target.dataset.section;
    upsert(store.data[section], section === "growth" ? { title: data.title, progress: Math.min(100, n(data.progress)), memo: data.memo } : { title: data.title, group: data.group, due: data.due, progress: Math.min(100, n(data.progress)), memo: data.memo }, editId);
  }
  store.save("저장했어요."); closeModal(); render();
});

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-do]"); if (!button) return; const action = button.dataset.do;
  if (action === "close") closeModal();
  if (action === "saveAll") store.save("전체 내용을 저장·동기화했어요.");
  if (action === "quick") { event.preventDefault(); quickModal(); }
  if (action === "task") taskModal({}, button.dataset.cat || "work");
  if (action === "event") eventModal({}, button.dataset.cat || "work");
  if (action === "transaction") transactionModal();
  if (action === "annualItem") annualModal();
  if (action === "annualCell") annualModal({}, button.dataset.row, button.dataset.month);
  if (action === "childItem") childModal(button.dataset.child, button.dataset.section);
  if (action === "trip") tripModal({}, button.dataset.type || travelTab);
  if (action === "moveItem") moveModal();
  if (action === "assetItem") assetModal(button.dataset.section);
  if (action === "simpleItem") simpleModal(button.dataset.section);
  if (action === "toggle") { const item = findItem(button.dataset.kind, button.dataset.id); if (item) { item.done = !item.done; store.save(); render(); } }
  if (action === "edit") {
    const kind = button.dataset.kind, item = findItem(kind, button.dataset.id, button.dataset.child, button.dataset.section); if (!item) return;
    if (kind === "tasks") taskModal(item, item.category);
    else if (kind === "events") eventModal(item, item.category);
    else if (kind === "transactions") transactionModal(item);
    else if (kind === "annualPlans") annualModal(item);
    else if (kind === "childItem") childModal(button.dataset.child, button.dataset.section, item);
    else if (kind === "trips") tripModal(item, item.type);
    else if (kind === "moveItems") moveModal(item);
    else if (kind === "cards") cardModal(item);
    else if (["growth", "goals"].includes(kind)) simpleModal(kind, item);
    else if (ASSET_SECTIONS[kind]) assetModal(kind, item);
  }
  if (action === "delete") {
    const kind = button.dataset.kind, item = findItem(kind, button.dataset.id, button.dataset.child, button.dataset.section); if (!item) return;
    if (!confirm(`"${item.title || item.name || item.item || "이 항목"}"을(를) 삭제할까요?`)) return;
    if (kind === "childItem") store.data.childData[button.dataset.child][button.dataset.section] = store.data.childData[button.dataset.child][button.dataset.section].filter(value => value.id !== button.dataset.id);
    else store.data[kind] = store.data[kind].filter(value => value.id !== button.dataset.id);
    store.save("삭제했어요."); render();
  }
  if (action === "addOnDate") eventModal({}, "work", button.dataset.date);
  if (action === "workTab") { workTab = button.dataset.tab; render(); }
  if (action === "assetTab") { assetTab = button.dataset.tab; render(); }
  if (action === "assetSection") { assetTab = "manage"; render(); setTimeout(() => document.querySelector(`[data-section="${button.dataset.section}"]`)?.scrollIntoView({ behavior: "smooth" }), 50); }
  if (action === "childTab") { childTab = button.dataset.tab; render(); }
  if (action === "openChild") { childTab = button.dataset.child; render(); }
  if (action === "travelTab") { travelTab = button.dataset.tab; render(); }
  if (action === "calendarPrev") { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); render(); }
  if (action === "calendarNext") { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); render(); }
  if (action === "calendarToday") { calendarCursor = new Date(); render(); }
  if (action === "annualPrev") { annualYear--; render(); }
  if (action === "annualNext") { annualYear++; render(); }
  if (action === "ledgerPrev" || action === "ledgerNext") { const [year, month] = ledgerMonth.split("-").map(Number); const d = new Date(year, month - 1 + (action === "ledgerNext" ? 1 : -1), 1); ledgerMonth = d.toISOString().slice(0, 7); render(); }
  if (action === "sync") syncModal();
  if (action === "signIn") { try { await store.signIn(); closeModal(); } catch { toast("로그인을 완료하지 못했어요."); } }
  if (action === "signOut") { await store.signOut(); closeModal(); }
});

$("#backdrop").addEventListener("click", event => { if (event.target === $("#backdrop")) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
window.addEventListener("hashchange", render);
await store.init();
if (!location.hash) location.hash = "#/home";
render();
