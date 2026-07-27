const CATEGORIES=[
 {id:'work',name:'업무',icon:'💼',keywords:['업무','보고','점검','교육','회의','NSF','대표','개선','공지','가이드']},
 {id:'kids',name:'아이·교육',icon:'👧',keywords:['도담','소담','학교','학원','돌봄','줄넘기','책','독서','수업','숙제']},
 {id:'home',name:'집·살림',icon:'🏠',keywords:['집','청소','세탁','장보기','정리','살림','수리']},
 {id:'move',name:'이사준비',icon:'📦',keywords:['이사','도배','장판','샤시','입주','폐가전','버릴','가져갈','커튼','가구']},
 {id:'money',name:'가계·자산',icon:'💰',keywords:['돈','가계','예산','카드','대출','전세금','자산','주식','보험','납부']},
 {id:'travel',name:'여행',icon:'✈️',keywords:['여행','호텔','리조트','표','티켓','출발','경주','푸꾸옥','아쿠아','예약']},
 {id:'health',name:'건강',icon:'🌿',keywords:['병원','검진','약','운동','건강','치과','예방접종']},
 {id:'shopping',name:'구매·준비물',icon:'🛒',keywords:['사기','구매','주문','준비물','챙기기','견적']},
 {id:'blog',name:'블로그·기록',icon:'✍️',keywords:['블로그','글쓰기','포스팅','사진','기록']}
];
const makeId=()=>crypto.randomUUID?.()||'id_'+Date.now()+'_'+Math.random().toString(16).slice(2);
const initialTasks=[
 {id:makeId(),title:'아쿠아필드 성인 2명·아동 2명 표 구매',cat:'travel',date:'2026-10-03',priority:'높음',done:false,note:'경주 켄싱턴 여행'},
 {id:makeId(),title:'11월 전세금 퇴거대출 조건 알아보기',cat:'money',date:'2026-11-01',priority:'높음',done:false,note:'농협 포함 비교'},
 {id:makeId(),title:'이사짐 견적받기',cat:'move',date:'2027-02-01',priority:'보통',done:false,note:'2~3월 이사 준비'},
 {id:makeId(),title:'폐가전·가구 수거업체 알아보기',cat:'move',date:'2027-02-10',priority:'보통',done:false,note:'쇼파, 밥솥, 전자레인지 등'},
 {id:makeId(),title:'도담 줄넘기 방학 시간 확인',cat:'kids',date:'2026-07-28',priority:'높음',done:false,note:''},
 {id:makeId(),title:'이사 후 통신·가전 이전 신청 목록 정리',cat:'move',date:'2027-02-20',priority:'보통',done:false,note:'식기세척기·에어컨·세탁기·냉장고'}
];
const defaultState={tasks:initialTasks,categories:CATEGORIES,projects:[
 {name:'2027년 3월 이사',cat:'move',progress:18,due:'2027-03-01'},
 {name:'2026 경주 가족여행',cat:'travel',progress:45,due:'2026-10-03'},
 {name:'은정 AI 비서 만들기',cat:'work',progress:35,due:'2026-08-31'}
]};
let state=loadState();
let currentView='home';
const $=s=>document.querySelector(s);
function loadState(){
  try{
    const mobile=localStorage.getItem('ejbrain-mobile-state');
    if(mobile) return JSON.parse(mobile);
    const old=localStorage.getItem('ejbrain-state');
    if(old) return JSON.parse(old);
  }catch(e){}
  return structuredClone?structuredClone(defaultState):JSON.parse(JSON.stringify(defaultState));
}
function save(){localStorage.setItem('ejbrain-mobile-state',JSON.stringify(state))}
function cat(id){return state.categories.find(c=>c.id===id)||{name:'기타',icon:'📌'}}
function fmt(d){if(!d)return'날짜 미정';return new Date(d+'T00:00:00').toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function classify(text){
  const scores=state.categories.map(c=>({id:c.id,score:(c.keywords||[]).reduce((n,k)=>n+(text.includes(k)?1:0),0)})).sort((a,b)=>b.score-a.score);
  return scores[0]?.score?scores[0].id:'shopping';
}
function fillSelects(){
  const opts=state.categories.map(c=>`<option value="${c.id}">${c.icon} ${escapeHtml(c.name)}</option>`).join('');
  $('#categorySelect').innerHTML='<option value="auto">AI 자동분류</option>'+opts;
  $('#taskCategory').innerHTML=opts;
}
function render(){renderStats();renderTasks();renderProjects();renderCategories();renderBriefing();save()}
function renderBriefing(){
  const open=state.tasks.filter(t=>!t.done),high=open.filter(t=>t.priority==='높음').length;
  const total=state.tasks.length,done=state.tasks.filter(t=>t.done).length;
  const pct=total?Math.round(done/total*100):0;
  $('#progressRing').style.setProperty('--p',pct);$('#progressText').textContent=pct+'%';
  $('#briefingText').textContent=high?`중요한 일 ${high}개가 남아 있어요. 먼저 확인해볼까요?`:'급한 일은 없어요. 오늘 할 일을 차근차근 정리해봐요.';
}
function renderStats(){
  const today=new Date().toISOString().slice(0,10),open=state.tasks.filter(t=>!t.done);
  const data=[['○',open.length,'미완료'],['◷',open.filter(t=>t.date===today).length,'오늘 마감'],['!',open.filter(t=>t.priority==='높음').length,'중요'],['▦',state.projects.length,'프로젝트']];
  $('#stats').innerHTML=data.map(x=>`<div class="summary-card"><span class="summary-icon">${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
}
function filteredTasks(){
  const f=$('#taskFilter').value,today=new Date().toISOString().slice(0,10);let list=[...state.tasks];
  if(f==='open')list=list.filter(t=>!t.done);if(f==='done')list=list.filter(t=>t.done);if(f==='today')list=list.filter(t=>t.date===today);
  return list.sort((a,b)=>(a.done-b.done)||(a.priority==='높음'?-1:1)||(a.date||'9999').localeCompare(b.date||'9999'));
}
function taskHtml(t){
  const c=cat(t.cat);return `<article class="task-card ${t.done?'done':''}">
    <label class="check-wrap"><input type="checkbox" data-check="${t.id}" ${t.done?'checked':''}></label>
    <div class="task-content"><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta">${c.icon} ${escapeHtml(c.name)} · ${fmt(t.date)}${t.note?' · '+escapeHtml(t.note):''}</div><div class="task-badges"><span class="badge ${t.priority==='높음'?'high':''}">${escapeHtml(t.priority)}</span></div></div>
    <button class="delete-btn" data-del="${t.id}" aria-label="삭제">×</button>
  </article>`;
}
function renderTasks(){const list=filteredTasks();$('#taskList').innerHTML=list.length?list.map(taskHtml).join(''):'<div class="empty-card">표시할 일이 없어요.</div>'}
function renderProjects(){$('#projectList').innerHTML=state.projects.map(p=>`<article class="project-card"><div class="project-head"><b>${escapeHtml(p.name)}</b><strong>${p.progress}%</strong></div><div class="project-meta">${cat(p.cat).icon} ${escapeHtml(cat(p.cat).name)} · ${fmt(p.due)}</div><div class="bar"><span style="width:${Math.max(0,Math.min(100,p.progress))}%"></span></div></article>`).join('')}
function renderCategories(){$('#categoryCards').innerHTML=state.categories.map(c=>{const all=state.tasks.filter(t=>t.cat===c.id),open=all.filter(t=>!t.done).length;return `<article class="category-card" data-cat="${c.id}"><div class="icon">${c.icon}</div><h4>${escapeHtml(c.name)}</h4><small>미완료 ${open}개<br>전체 ${all.length}개</small></article>`}).join('')}
function scrollToSelector(sel){document.querySelector(sel)?.scrollIntoView({behavior:'smooth',block:'start'})}
function setView(view){
  currentView=view;document.querySelectorAll('.bottom-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const map={home:['오늘','.greeting-card'],tasks:['할 일','.section-block:nth-of-type(3)'],inbox:['AI 수집함','.quick-capture'],projects:['프로젝트','.section-block:nth-of-type(4)'],categories:['카테고리','.categories-section']};
  $('#pageTitle').textContent=map[view][0];scrollToSelector(map[view][1]);if(view==='inbox')setTimeout(()=>$('#brainInput').focus(),350);
}
$('#saveBrainBtn').addEventListener('click',()=>{
  const text=$('#brainInput').value.trim();if(!text)return;
  const c=$('#categorySelect').value==='auto'?classify(text):$('#categorySelect').value,date=$('#dateInput').value;
  state.tasks.unshift({id:makeId(),title:text,cat:c,date,priority:/꼭|긴급|중요|예약|구매|마감/.test(text)?'높음':'보통',done:false,note:'AI 수집함에서 추가'});
  $('#aiResult').classList.remove('hidden');$('#aiResult').innerHTML=`${cat(c).icon} <b>${escapeHtml(cat(c).name)}</b>으로 분류했어요.${date?' 마감일은 '+fmt(date)+'입니다.':' 날짜는 미정으로 저장했어요.'}`;
  $('#brainInput').value='';$('#dateInput').value='';render();
});
$('#taskList').addEventListener('click',e=>{const id=e.target.dataset.check||e.target.dataset.del;if(!id)return;if(e.target.dataset.check){const t=state.tasks.find(x=>x.id===id);if(t)t.done=e.target.checked}else{state.tasks=state.tasks.filter(x=>x.id!==id)}render()});
$('#taskFilter').addEventListener('change',renderTasks);
$('#quickAdd').addEventListener('click',()=>$('#taskDialog').showModal());
$('#taskForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;state.tasks.unshift({id:makeId(),title:$('#taskTitle').value.trim(),cat:$('#taskCategory').value,date:$('#taskDate').value,priority:$('#taskPriority').value,done:false,note:$('#taskNote').value.trim()});setTimeout(()=>{e.target.reset();render()},0)});
document.querySelectorAll('.bottom-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#categoryCards').addEventListener('click',e=>{const card=e.target.closest('[data-cat]');if(!card)return;const id=card.dataset.cat;$('#pageTitle').textContent=cat(id).name;$('#taskFilter').value='all';const list=state.tasks.filter(t=>t.cat===id);$('#taskList').innerHTML=list.length?list.map(taskHtml).join(''):'<div class="empty-card">아직 등록된 일이 없어요.</div>';scrollToSelector('.section-block:nth-of-type(3)')});
$('#addCategoryBtn').addEventListener('click',()=>{const name=prompt('새 카테고리 이름');if(!name)return;const icon=prompt('아이콘(이모지)','📌')||'📌';state.categories.push({id:'cat_'+Date.now(),name,icon,keywords:[name]});fillSelects();render()});
$('#settingsBtn').addEventListener('click',()=>$('#settingsDialog').showModal());$('#closeSettings').addEventListener('click',()=>$('#settingsDialog').close());
$('#exportBtn').addEventListener('click',()=>{const b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='EJ_Brain_Mobile_백업.json';a.click();URL.revokeObjectURL(a.href)});
$('#importFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);fillSelects();render();$('#settingsDialog').close()}catch{alert('올바른 EJ Brain 백업 파일이 아닙니다.')}};r.readAsText(f)});
$('#resetBtn').addEventListener('click',()=>{if(confirm('저장한 내용을 모두 초기화할까요?')){localStorage.removeItem('ejbrain-mobile-state');localStorage.removeItem('ejbrain-state');location.reload()}});
$('#todayText').textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
fillSelects();render();
