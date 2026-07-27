import { firebaseConfig } from "./firebase-config.js";

const NAV=[
  ["home","홈","⌂"],["work","업무","✓"],["parenting","육아","♧"],["assets","자산","₩"],
  ["move","부동산·이사","⌂"],["growth","자기계발","✦"],["goals","목표관리","◎"]
];
const LABEL=Object.fromEntries(NAV.map(([id,label])=>[id,label]));
const $=(s,r=document)=>r.querySelector(s);
const KEY="eunjeong-brain-v1";
const id=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const iso=(n=0)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const won=v=>`${Math.abs(Number(v||0)).toLocaleString("ko-KR")}원`;
const short=v=>{v=Number(v||0);const a=Math.abs(v);return a>=1e8?`${(v/1e8).toFixed(1).replace(".0","")}억`:a>=1e4?`${Math.round(v/1e4).toLocaleString()}만`:v.toLocaleString()};
const date=v=>new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric",weekday:"short"}).format(new Date(`${v}T12:00:00`));

function initial(){
  return{
    version:1,profile:{name:"은정"},
    tasks:[
      {id:id(),title:"8월 점검 계획 정리",category:"work",date:iso(),priority:"high",done:false},
      {id:id(),title:"전세금·퇴거대출 일정 확인",category:"move",date:iso(2),priority:"normal",done:false},
      {id:id(),title:"도담이 방학 줄넘기 시간 확인",category:"parenting",date:iso(3),priority:"normal",done:false},
      {id:id(),title:"폐가전·가구 수거 목록 만들기",category:"move",date:iso(5),priority:"normal",done:false}
    ],
    events:[
      {id:id(),title:"주간 업무 정리",category:"work",date:iso(1),time:"09:00"},
      {id:id(),title:"도담·소담 일정 점검",category:"parenting",date:iso(3),time:"20:30"},
      {id:id(),title:"이삿짐 견적 비교",category:"move",date:iso(7),time:"19:00"}
    ],
    inbox:[],
    accounts:[
      {id:id(),name:"현금·예금",type:"cash",amount:0},{id:id(),name:"주식·연금",type:"investment",amount:0},
      {id:id(),name:"부동산",type:"property",amount:0},{id:id(),name:"대출",type:"debt",amount:0}
    ],
    transactions:[],
    moveItems:[
      {id:id(),title:"샤시 전체",done:false,group:"수리"},{id:id(),title:"도배·장판·도장",done:false,group:"수리"},
      {id:id(),title:"입주청소",done:false,group:"수리"},{id:id(),title:"이삿짐 업체 견적",done:false,group:"이사"},
      {id:id(),title:"통신·가전 이전 신청",done:false,group:"이사"}
    ],
    growth:[
      {id:id(),title:"바이브코딩 익히기",progress:25},{id:id(),title:"식품안전 업무 자동화",progress:15},
      {id:id(),title:"ChatGPT 프롬프트 활용",progress:35}
    ],
    goals:[
      {id:id(),title:"은정 Brain 완성",group:"자기계발",progress:20,due:"2026-09-30"},
      {id:id(),title:"2027년 이사 준비",group:"가족",progress:30,due:"2027-03-06"},
      {id:id(),title:"도담·소담 매월 국내여행",group:"육아",progress:50,due:"2026-12-31"}
    ]
  };
}

class Store{
  constructor(){
    try{this.data={...initial(),...JSON.parse(localStorage.getItem(KEY))}}catch{this.data=initial()}
    this.user=null;this.fb=null;this.timer=null;
  }
  local(){localStorage.setItem(KEY,JSON.stringify(this.data))}
  save(){
    this.local();
    if(!this.user||!this.fb)return;
    clearTimeout(this.timer);
    this.timer=setTimeout(()=>{
      const {fire,db}=this.fb;
      fire.setDoc(fire.doc(db,"brains",this.user.uid),{state:this.data,updatedAt:fire.serverTimestamp()},{merge:true});
    },350);
  }
  async init(){
    this.local();
    if(!firebaseConfig.apiKey||!firebaseConfig.projectId||!firebaseConfig.appId)return;
    try{
      const [core,auth,fire]=await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
      ]);
      const app=core.initializeApp(firebaseConfig),a=auth.getAuth(app),db=fire.getFirestore(app);
      this.fb={auth,fire,a,db};
      auth.onAuthStateChanged(a,async user=>{
        this.user=user;
        if(user){
          const ref=fire.doc(db,"brains",user.uid),snap=await fire.getDoc(ref);
          if(snap.exists()){this.data={...initial(),...snap.data().state};this.local()}
          else await fire.setDoc(ref,{state:this.data,updatedAt:fire.serverTimestamp()});
        }
        render();syncUI();
      });
    }catch(e){console.warn(e);toast("동기화 설정을 확인해 주세요. 현재 기기에는 정상 저장됩니다.")}
  }
  async signIn(){if(!this.fb)return syncModal();await this.fb.auth.signInWithPopup(this.fb.a,new this.fb.auth.GoogleAuthProvider())}
  async signOut(){if(this.fb)await this.fb.auth.signOut(this.fb.a)}
}
const store=new Store();
let workTab="dashboard",assetTab="dashboard",toastTimer;
const route=()=>{const r=location.hash.replace(/^#\//,"").split("/")[0]||"home";return NAV.some(x=>x[0]===r)?r:"home"};

function nav(mobile=false){
  const items=mobile?[["home","홈","⌂"],["work","업무","✓"],["quick","수집함","＋"],["assets","자산","₩"],["goals","목표","◎"]]:NAV;
  return items.map(([r,label,icon])=>{
    if(r==="quick")return`<a href="#" data-do="quick"><em>${icon}</em>${label}</a>`;
    const count=!mobile&&r==="work"?store.data.tasks.filter(t=>t.category==="work"&&!t.done).length:0;
    return`<a class="${mobile?"":"nav"} ${route()===r?"active":""}" href="#/${r}"><em>${icon}</em>${label}${count?`<i>${count}</i>`:""}</a>`;
  }).join("");
}
function head(title,copy,actions=""){
  return`<header class="pageHead"><div><small>EUNJEONG BRAIN</small><h1>${title}</h1><p>${copy}</p></div>${actions?`<div class="actions">${actions}</div>`:""}</header>`;
}
function stat(label,value,copy,icon){return`<article class="stat"><header><span>${label}</span><i class="ico">${icon}</i></header><b>${value}</b><small>${copy}</small></article>`}
function tasks(items,limit=50){
  if(!items.length)return`<div class="empty"><b>✓</b>등록된 할 일이 없어요.</div>`;
  return`<div class="tasks">${items.slice(0,limit).map(t=>`<article class="task"><button class="check ${t.done?"on":""}" data-do="toggle" data-id="${t.id}">${t.done?"✓":""}</button><div><h3 class="${t.done?"done":""}">${esc(t.title)}</h3><small>${date(t.date)}${t.priority==="high"?" · 중요":""}</small></div><span class="tag ${t.category}">${LABEL[t.category]||t.group||"기타"}</span></article>`).join("")}</div>`;
}
function events(items,limit=6){
  items=[...items].sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0,limit);
  if(!items.length)return`<div class="empty"><b>◷</b>다가오는 일정이 없어요.</div>`;
  return`<div class="rows">${items.map(e=>{const d=new Date(`${e.date}T12:00:00`);return`<article class="row"><span class="date"><span><b>${d.getDate()}</b><small>${d.getMonth()+1}월</small></span></span><div class="rowCopy"><strong>${esc(e.title)}</strong><small>${e.time||"시간 미정"} · ${LABEL[e.category]||"일정"}</small></div><span class="tag ${e.category}">${LABEL[e.category]||"일정"}</span></article>`}).join("")}</div>`;
}
function home(){
  const open=store.data.tasks.filter(t=>!t.done),today=open.filter(t=>t.date===iso()).length;
  const move=Math.round(store.data.moveItems.filter(x=>x.done).length/Math.max(store.data.moveItems.length,1)*100);
  return`${head(`좋은 아침이에요, ${esc(store.data.profile.name)}님`,`오늘 해야 할 것과 가족의 흐름을 가볍게 정리해요.`)}
  <section class="hero"><article class="capture"><p class="kicker">BRAIN INBOX</p><h2>생각나는 대로 적어 주세요.</h2><p>일정·업무·아이들·돈·이사 메모를 내용에 맞게 분류해요.</p><form id="captureForm"><input name="text" placeholder="예: 금요일 이삿짐 견적 전화하기" required><button class="primary">Brain에 담기</button></form></article><article class="quote"><b>“</b><p>머릿속에서 꺼내 놓으면,<br>오늘은 조금 더 가벼워져요.</p><small>은정 Brain · 오늘의 한마디</small></article></section>
  <section class="stats">${stat("오늘 할 일",`${today}개`,`${open.length}개 남아 있어요`,"✓")}${stat("다가오는 일정",`${store.data.events.filter(e=>e.date>=iso()).length}개`,"가족·업무 일정","◷")}${stat("Brain 수집함",`${store.data.inbox.length}개`,"자동 분류한 메모","✦")}${stat("이사 준비",`${move}%`,"2027년 3월 목표","⌂")}</section>
  <section class="grid2"><article class="panel"><header class="panelHead"><div><h2>지금 해야 할 일</h2><p>업무와 가족 일정을 한 번에 확인해요</p></div><button class="textBtn" data-do="task">할 일 추가</button></header><div class="panelBody">${tasks([...store.data.tasks].sort((a,b)=>a.done-b.done||a.date.localeCompare(b.date)),6)}</div></article><article class="panel"><header class="panelHead"><div><h2>다가오는 일정</h2><p>가까운 일정부터 보여드려요</p></div><button class="textBtn" data-do="event">일정 추가</button></header><div class="panelBody">${events(store.data.events.filter(e=>e.date>=iso()),4)}</div></article></section>
  <section class="miniGrid">${[["work","✓","업무","업무계획, 할 일과 달력을 한곳에서 관리"],["parenting","♧","도담·소담","시간표, 학습 로드맵과 가족 일정"],["assets","₩","우리 집 자산","자산 대시보드와 가계부 월별 분석"]].map(([r,i,t,p])=>`<article class="mini"><i class="ico">${i}</i><h3>${t}</h3><p>${p}</p><a href="#/${r}">→</a></article>`).join("")}</section>`;
}
function work(){
  const ts=store.data.tasks.filter(t=>t.category==="work"),es=store.data.events.filter(e=>e.category==="work"),done=ts.filter(t=>t.done).length;
  let body=workTab==="dashboard"?`<section class="stats">${stat("진행할 업무",`${ts.length-done}개`,"완료 전 업무","✓")}${stat("완료 업무",`${done}개`,"전체 업무 기록","●")}${stat("업무 일정",`${es.length}개`,"달력 등록 일정","◷")}${stat("완료율",`${Math.round(done/Math.max(ts.length,1)*100)}%`,"현재 계획 기준","◎")}</section><section class="grid2"><article class="panel"><header class="panelHead"><div><h2>업무계획</h2><p>중요 업무와 마감일</p></div><button class="textBtn" data-do="task" data-cat="work">업무 추가</button></header><div class="panelBody">${tasks(ts)}</div></article><article class="panel"><header class="panelHead"><div><h2>업무 일정</h2><p>달력에 연결된 일정</p></div><button class="textBtn" data-do="event" data-cat="work">일정 추가</button></header><div class="panelBody">${events(es)}</div></article></section>`:workTab==="plan"?`<article class="panel"><header class="panelHead"><div><h2>업무계획표</h2><p>날짜와 중요도를 함께 저장합니다</p></div><button class="primary" data-do="task" data-cat="work">＋ 새 업무</button></header><div class="panelBody">${tasks(ts)}</div></article>`:calendar([...ts,...es]);
  return`${head("업무","업무계획과 일정이 하나의 달력으로 연결돼요.",`<button class="secondary" data-do="event" data-cat="work">＋ 일정 입력</button><button class="primary" data-do="task" data-cat="work">＋ 업무 추가</button>`)}<div class="tabs">${[["dashboard","업무 대시보드"],["plan","업무계획"],["calendar","업무 달력"]].map(([x,l])=>`<button class="${workTab===x?"on":""}" data-do="workTab" data-tab="${x}">${l}</button>`).join("")}</div>${body}`;
}
function calendar(items){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
  const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const x=d.toISOString().slice(0,10),dayItems=items.filter(v=>v.date===x);return`<div class="day ${d.getMonth()!==m?"out":""} ${x===iso()?"today":""}"><span class="num">${d.getDate()}</span>${dayItems.slice(0,3).map(v=>`<div class="calItem ${v.time?"event":""}">${esc(v.title)}</div>`).join("")}</div>`}).join("");
  return`<article class="panel"><header class="panelHead"><div><h2>${y}년 ${m+1}월</h2><p>업무와 일정이 자동으로 표시됩니다</p></div><button class="textBtn" data-do="event" data-cat="work">일정 입력</button></header><div class="panelBody calendarWrap"><div class="calendar"><div class="week">${["일","월","화","수","목","금","토"].map(x=>`<span>${x}</span>`).join("")}</div><div class="days">${days}</div></div></div></article>`;
}
function parenting(){
  return`${head("도담·소담","아이별 일정과 학습 로드맵을 한눈에 관리해요.",`<button class="primary" data-do="event" data-cat="parenting">＋ 아이 일정</button>`)}
  <section class="people"><article class="person dodam"><span class="avatar">📚</span><h3>도담</h3><p>초등 1학년<br>독서 · 사고력수학 · 영어 · 줄넘기</p><button class="textBtn space" data-do="later">도담 페이지 열기 →</button></article><article class="person sodam"><span class="avatar">🌼</span><h3>소담</h3><p>5세<br>그림책 · 놀이수학 · 한글 · 신체활동</p><button class="textBtn space" data-do="later">소담 페이지 열기 →</button></article><article class="person"><span class="avatar">🗓</span><h3>가족 일정</h3><p>학교, 유치원, 학원과 체험학습 일정을 한 달력으로 모아요.</p><button class="textBtn space" data-do="event" data-cat="parenting">일정 추가 →</button></article></section>
  <section class="grid2 space"><article class="panel"><header class="panelHead"><div><h2>다가오는 아이 일정</h2><p>도담·소담 일정 모아보기</p></div></header><div class="panelBody">${events(store.data.events.filter(e=>e.category==="parenting"))}</div></article><article class="panel"><header class="panelHead"><div><h2>교육 로드맵</h2><p>큰 방향을 잊지 않도록 기록해요</p></div></header><div class="panelBody rows"><div class="row"><span class="tag growth">2026</span><div class="rowCopy"><strong>도담 초1 · 소담 5세</strong><small>현행 중심, 독서·운동·체험의 균형</small></div></div><div class="row"><span class="tag growth">2027</span><div class="rowCopy"><strong>이사와 새 환경 적응</strong><small>생활 루틴 안정 후 학습계획 조정</small></div></div><div class="row"><span class="tag growth">2028</span><div class="rowCopy"><strong>도담 초3 전환점</strong><small>사회·과학 개념과 영어학원 검토</small></div></div></div></article></section>`;
}
function summary(){
  const asset=store.data.accounts.filter(a=>a.type!=="debt").reduce((s,a)=>s+Number(a.amount),0),debt=store.data.accounts.filter(a=>a.type==="debt").reduce((s,a)=>s+Number(a.amount),0),month=iso().slice(0,7),tx=store.data.transactions.filter(t=>t.date.startsWith(month)),income=tx.filter(t=>t.kind==="income").reduce((s,t)=>s+Number(t.amount),0),expense=tx.filter(t=>t.kind==="expense").reduce((s,t)=>s+Number(t.amount),0);return{asset,debt,net:asset-debt,income,expense,balance:income-expense};
}
function transactionRows(items){
  if(!items.length)return`<div class="empty"><b>₩</b>첫 가계부 내역을 입력해 보세요.</div>`;
  return`<div class="rows">${items.map(t=>`<article class="row"><i class="ico">${t.kind==="income"?"＋":"−"}</i><div class="rowCopy"><strong>${esc(t.title)}</strong><small>${t.date} · ${esc(t.category)}</small></div><span class="amount ${t.kind}">${t.kind==="income"?"+":"−"}${won(t.amount)}</span></article>`).join("")}</div>`;
}
function accountRows(){
  const names={cash:"현금·예금",investment:"투자",property:"부동산",debt:"부채"};
  return`<div class="rows">${store.data.accounts.map(a=>`<article class="row"><i class="ico">${a.type==="debt"?"−":"₩"}</i><div class="rowCopy"><strong>${esc(a.name)}</strong><small>${names[a.type]}</small></div><span class="amount">${won(a.amount)}</span></article>`).join("")}</div>`;
}
function assets(){
  const s=summary();let body;
  if(assetTab==="dashboard"){const insight=s.expense?`이번 달 지출은 ${won(s.expense)}이에요. 수입 대비 ${s.income?Math.round(s.expense/s.income*100):0}%를 사용했어요.`:"가계부를 입력하면 이번 달 지출 구조와 예산 흐름을 자동으로 분석해 드려요.";body=`<section class="assetHero"><article class="total"><small>순자산</small><strong>${won(s.net)}</strong><div class="breakdown"><div><small>총자산</small><b>${short(s.asset)}원</b></div><div><small>대출</small><b>${short(s.debt)}원</b></div><div><small>이번 달 잔액</small><b>${short(s.balance)}원</b></div></div></article><article class="insight"><h3>✦ 이번 달 지출 분석</h3><p>${insight}</p></article></section><section class="grid2 space"><article class="panel"><header class="panelHead"><div><h2>최근 가계부</h2><p>수입과 지출 기록</p></div><button class="textBtn" data-do="transaction">내역 추가</button></header><div class="panelBody">${transactionRows([...store.data.transactions].reverse().slice(0,6))}</div></article><article class="panel"><header class="panelHead"><div><h2>자산 구성</h2><p>현금·투자·부동산·대출</p></div><button class="textBtn" data-do="account">자산 추가</button></header><div class="panelBody">${accountRows()}</div></article></section>`}else if(assetTab==="ledger")body=`<article class="panel"><header class="panelHead"><div><h2>가계부</h2><p>입력한 내역이 자산 대시보드에 즉시 반영됩니다</p></div><button class="primary" data-do="transaction">＋ 내역 입력</button></header><div class="panelBody">${transactionRows([...store.data.transactions].sort((a,b)=>b.date.localeCompare(a.date)))}</div></article>`;else body=`<article class="panel"><header class="panelHead"><div><h2>현 자산현황</h2><p>입력할 때마다 순자산이 다시 계산됩니다</p></div><button class="primary" data-do="account">＋ 자산 입력</button></header><div class="panelBody">${accountRows()}</div></article>`;
  return`${head("자산","현재 자산, 가계부와 월별 흐름을 한곳에서 확인해요.",`<button class="secondary" data-do="account">＋ 자산 입력</button><button class="primary" data-do="transaction">＋ 가계부 입력</button>`)}<div class="tabs">${[["dashboard","자산 대시보드"],["ledger","가계부"],["accounts","자산현황"]].map(([x,l])=>`<button class="${assetTab===x?"on":""}" data-do="assetTab" data-tab="${x}">${l}</button>`).join("")}</div>${body}`;
}
function move(){
  const done=store.data.moveItems.filter(x=>x.done).length,rate=Math.round(done/Math.max(store.data.moveItems.length,1)*100),mapped=store.data.moveItems.map(x=>({...x,category:"move",date:"2027-03-06"}));
  return`${head("부동산·이사","문촌19단지, 수리와 2027년 3월 이사 준비를 차근차근 관리해요.",`<button class="primary" data-do="moveItem">＋ 준비 항목</button>`)}<section class="grid2"><article class="panel"><header class="panelHead"><div><h2>이사 준비 현황 · ${rate}%</h2><p>${done}/${mapped.length} 완료 · 목표일 2027년 3월 6일</p></div></header><div class="panelBody">${tasks(mapped)}</div></article><article class="panel"><header class="panelHead"><div><h2>부동산 기록</h2><p>중요 기준을 한곳에 모아요</p></div></header><div class="panelBody rows"><div class="row"><i class="ico">⌂</i><div class="rowCopy"><strong>문촌마을 19단지</strong><small>재건축 진행상황·분담금 계속 업데이트</small></div></div><div class="row"><i class="ico">◷</i><div class="rowCopy"><strong>전세 만기</strong><small>2027년 3월 6일</small></div></div><div class="row"><i class="ico">₩</i><div class="rowCopy"><strong>대출·자금 계획</strong><small>자산 화면과 연결 예정</small></div></div></div></article></section>`;
}
function goalCards(items,type){
  return`<section class="goals">${items.map(x=>`<article class="goal"><header><h3>${esc(x.title)}</h3><b>${x.progress}%</b></header><p>${type==="goal"?`${esc(x.group)} · ${x.due}까지`:"조금씩 꾸준히 쌓아가는 중이에요."}</p><div class="progress"><i style="width:${Math.min(x.progress,100)}%"></i></div><button class="textBtn" data-do="advance" data-type="${type}" data-id="${x.id}">10% 진전 기록</button></article>`).join("")}</section>`;
}
function growth(){return`${head("자기계발","배우고 싶은 것과 업무 자동화 아이디어를 실제 진전으로 바꿔요.",`<button class="primary" data-do="growthItem">＋ 성장 목표</button>`)}${goalCards(store.data.growth,"growth")}<article class="panel space"><header class="panelHead"><div><h2>다음에 만들 자동화</h2><p>아이디어를 잊지 않도록 모아 둬요</p></div><button class="textBtn" data-do="task" data-cat="growth">추가</button></header><div class="panelBody">${tasks(store.data.tasks.filter(t=>t.category==="growth"))}</div></article>`}
function goals(){return`${head("목표관리","연간 목표, 가족 계획과 버킷리스트의 진척도를 확인해요.",`<button class="primary" data-do="goalItem">＋ 새 목표</button>`)}${goalCards(store.data.goals,"goal")}<section class="miniGrid"><article class="mini"><i class="ico">✈</i><h3>도담이 세계여행</h3><p>8세부터 매년 한 나라씩 만나는 평생 여행 프로젝트</p></article><article class="mini"><i class="ico">⌂</i><h3>2027년 이사</h3><p>가족의 새 보금자리를 위한 장기 프로젝트</p></article><article class="mini"><i class="ico">♧</i><h3>가족 경험</h3><p>매월 국내여행과 박물관·체험 기록</p></article></section>`}
function render(){
  $("#sideNav").innerHTML=nav(false);$("#bottomNav").innerHTML=nav(true);
  $("#app").innerHTML=({home,work,parenting,assets,move,growth,goals}[route()]||home)();
  syncUI();window.scrollTo(0,0);
}
function infer(text){
  const t=text.toLowerCase();let category="work";
  if(/도담|소담|학교|유치원|학원|숙제|줄넘기/.test(t))category="parenting";
  else if(/원|결제|카드|보험|대출|예금|주식|가계부/.test(t))category="assets";
  else if(/이사|수리|샤시|도배|장판|전세|재건축|가구/.test(t))category="move";
  else if(/공부|강의|배우|코딩|프롬프트/.test(t))category="growth";
  else if(/목표|버킷/.test(t))category="goals";
  return{category,date:/모레/.test(t)?iso(2):/내일/.test(t)?iso(1):iso()};
}
function capture(text){
  const x=infer(text);store.data.inbox.unshift({id:id(),text,...x,createdAt:new Date().toISOString()});store.data.tasks.unshift({id:id(),title:text,...x,priority:"normal",done:false});store.save();toast(`${LABEL[x.category]}로 분류해 담았어요.`);render();
}
function modal(title,body){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;$("#backdrop").hidden=false;document.body.style.overflow="hidden";setTimeout(()=>$("#modalBody input, #modalBody textarea")?.focus(),30)}
function close(){ $("#backdrop").hidden=true;document.body.style.overflow=""}
function field(name,label,type="text",value="",opts={}){
  if(type==="select")return`<div class="field ${opts.full?"full":""}"><label>${label}</label><select name="${name}">${opts.items.map(([v,l])=>`<option value="${v}" ${v===value?"selected":""}>${l}</option>`).join("")}</select></div>`;
  return`<div class="field ${opts.full?"full":""}"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${opts.min!=null?`min="${opts.min}"`:""} required></div>`;
}
function form(formId,fields,label="저장하기"){return`<form id="${formId}"><div class="formGrid">${fields}</div><div class="buttons"><button type="button" class="ghost" data-do="close">취소</button><button class="primary">${label}</button></div></form>`}
function taskModal(cat="work"){modal("새 할 일",form("taskForm",field("title","할 일","text","",{full:true})+field("category","카테고리","select",cat,{items:NAV.slice(1).map(x=>[x[0],x[1]])})+field("date","마감일","date",iso())+field("priority","중요도","select","normal",{items:[["normal","보통"],["high","중요"]] })))}
function eventModal(cat="work"){modal("새 일정",form("eventForm",field("title","일정 이름","text","",{full:true})+field("category","카테고리","select",cat,{items:NAV.slice(1).map(x=>[x[0],x[1]])})+field("date","날짜","date",iso())+field("time","시간","time","09:00")))}
function quickModal(){modal("Brain 빠른 수집",`<form id="quickForm"><div class="field"><label>생각나는 내용을 그대로 적어 주세요</label><textarea name="text" placeholder="예: 금요일 이삿짐 업체 세 곳 전화하기" required></textarea></div><p class="help">내용에 따라 업무·육아·자산·이사·자기계발·목표로 먼저 분류해요.</p><div class="buttons"><button type="button" class="ghost" data-do="close">취소</button><button class="primary">Brain에 담기</button></div></form>`)}
function syncModal(){
  const configured=!!(firebaseConfig.apiKey&&firebaseConfig.projectId&&firebaseConfig.appId),on=!!store.user;
  modal("PC·모바일 동기화",`<div class="syncInfo"><h3>${on?"✓ Google 계정으로 연결됨":configured?"동기화 준비 완료":"현재는 이 기기에 안전하게 저장 중"}</h3><p>${on?`${esc(store.user.email||"로그인 계정")}의 데이터로 PC와 모바일이 자동 연결됩니다.`:configured?"같은 Google 계정으로 로그인하면 모든 기기에서 같은 데이터가 보입니다.":"동봉된 안내서에 따라 Firebase 설정값을 한 번 넣으면 Google 로그인과 기기간 동기화가 켜집니다."}</p></div><div class="buttons">${on?`<button class="danger" data-do="signOut">로그아웃</button>`:configured?`<button class="primary" data-do="signIn">Google로 연결하기</button>`:`<button class="secondary" data-do="backup">현재 데이터 백업</button>`}<button class="ghost" data-do="close">닫기</button></div>`);
}
function syncUI(){const on=!!store.user;$("#syncDot")?.classList.toggle("on",on);if($("#syncTitle"))$("#syncTitle").textContent=on?"PC·모바일 동기화 중":"이 기기에 저장 중";if($("#syncText"))$("#syncText").textContent=on?(store.user.email||"Google 계정 연결됨"):"PC·모바일 연결 설정"}
function toast(text){const t=$("#toast");t.textContent=text;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400)}
function backup(){const blob=new Blob([JSON.stringify(store.data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`eunjeong-brain-${iso()}.json`;a.click();URL.revokeObjectURL(a.href);toast("현재 데이터를 백업했어요.")}

document.addEventListener("submit",e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());
  if(["captureForm","quickForm"].includes(e.target.id)){capture(d.text);close()}
  if(e.target.id==="taskForm"){store.data.tasks.unshift({id:id(),title:d.title,category:d.category,date:d.date,priority:d.priority,done:false});store.save();close();render();toast("할 일을 저장했어요.")}
  if(e.target.id==="eventForm"){store.data.events.unshift({id:id(),title:d.title,category:d.category,date:d.date,time:d.time});store.save();close();render();toast("일정을 달력에 저장했어요.")}
  if(e.target.id==="transactionForm"){store.data.transactions.push({id:id(),title:d.title,kind:d.kind,category:d.category,date:d.date,amount:Number(d.amount)});store.save();close();render();toast("가계부에 반영했어요.")}
  if(e.target.id==="accountForm"){store.data.accounts.push({id:id(),name:d.name,type:d.type,amount:Number(d.amount)});store.save();close();render();toast("자산현황에 추가했어요.")}
  if(e.target.id==="simpleForm"){if(d.target==="move")store.data.moveItems.push({id:id(),title:d.title,group:d.group,done:false});if(d.target==="growth")store.data.growth.push({id:id(),title:d.title,progress:0});if(d.target==="goal")store.data.goals.push({id:id(),title:d.title,group:d.group,progress:0,due:d.date});store.save();close();render();toast("새 항목을 저장했어요.")}
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-do]");if(!b)return;const x=b.dataset.do;
  if(x==="close")close();if(x==="quick"){e.preventDefault();quickModal()}if(x==="task")taskModal(b.dataset.cat||"work");if(x==="event")eventModal(b.dataset.cat||"work");
  if(x==="toggle"){const item=[...store.data.tasks,...store.data.moveItems].find(v=>v.id===b.dataset.id);if(item){item.done=!item.done;store.save();render()}}
  if(x==="workTab"){workTab=b.dataset.tab;render()}if(x==="assetTab"){assetTab=b.dataset.tab;render()}
  if(x==="transaction")modal("가계부 입력",form("transactionForm",field("title","내용","text","",{full:true})+field("kind","구분","select","expense",{items:[["expense","지출"],["income","수입"]]})+field("category","분류","select","생활비",{items:["생활비","교육","주거","보험","교통","여행","급여","기타"].map(v=>[v,v])})+field("amount","금액","number","",{min:0})+field("date","날짜","date",iso())));
  if(x==="account")modal("자산 입력",form("accountForm",field("name","자산 이름","text","",{full:true})+field("type","종류","select","cash",{items:[["cash","현금·예금"],["investment","주식·연금"],["property","부동산"],["debt","대출·부채"]]})+field("amount","현재 금액","number","",{min:0})));
  if(x==="moveItem")modal("이사 준비 항목",form("simpleForm",`<input type="hidden" name="target" value="move">${field("title","준비할 일","text","",{full:true})}${field("group","구분","select","이사",{items:["수리","이사","구매","처분"].map(v=>[v,v])})}`));
  if(x==="growthItem")modal("성장 목표",form("simpleForm",`<input type="hidden" name="target" value="growth">${field("title","배우거나 만들고 싶은 것","text","",{full:true})}`));
  if(x==="goalItem")modal("새 목표",form("simpleForm",`<input type="hidden" name="target" value="goal">${field("title","목표","text","",{full:true})}${field("group","분류","text","가족")}${field("date","목표일","date",iso(90))}`));
  if(x==="advance"){const list=b.dataset.type==="growth"?store.data.growth:store.data.goals,item=list.find(v=>v.id===b.dataset.id);if(item){item.progress=Math.min(100,item.progress+10);store.save();render();toast("진척도를 기록했어요.")}}
  if(x==="sync")syncModal();if(x==="signIn"){try{await store.signIn();close();toast("Google 계정으로 연결했어요.")}catch{toast("로그인을 완료하지 못했어요.")}}if(x==="signOut"){await store.signOut();close()}if(x==="backup")backup();if(x==="later")toast("다음 단계에서 상세 페이지로 확장할 예정이에요.");
});
$("#backdrop").addEventListener("click",e=>{if(e.target===$("#backdrop"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
window.addEventListener("hashchange",render);
await store.init();if(!location.hash)location.hash="#/home";render();
