/* Amnyam GEG — Live Reader v3.6
   single wheel, avatars, localStorage caching, dark theme
*/

const SHEET_PUB_ID = '2PACX-1vRGUrrrjcldGF4ttve-lFTgUWpz_0LqHlp7XfkddTtvdb6ZeORLN8UnYgo0UuNFvXrHakV_BlXyb_XI';
const GIDS = {
  "Введение":0,"Правила":1943023590,"Игры участников":1680403255,"Общий прогресс":229494004,"Статистика":498322058,
  "billymoore":1138059924,"blyy":1959229150,"Waff1e":884474143,"BlackSecret":1106107494,"marixyana_":2012264950,
  "zo_0m23":24435965,"mozyakin":117799979,"Bulkich":1530541297,"uebergoose":1420315228,"fuurooshaa":2118018073,
  "mden1ss":251270529,"aut0mat1clol":26905011,"nimaruichi_":853685662,"WenKlase":1414740397,"UNIKNOW":930194743,
  "Zawardo10":1029277380,"bloods1de":177063221,"boldnessman":499922627,"Soupsake":330622151,"Destiny":207670134,"Бeгимот":754149590
};
const PLAYERS = Object.keys(GIDS).filter(k => !["Введение","Правила","Игры участников","Общий прогресс","Статистика"].includes(k));

// ---- AVATARS ----
const PLAYER_AVATARS = {
  "billymoore": "Avatars/billymoore.jpg",
  "blyy": "Avatars/blyy.png",
  "Waff1e": "Avatars/Waff1e.png",
  "BlackSecret": "Avatars/BlackSecret.png",
  "marixyana_": "Avatars/marixyana_.png",
  "zo_0m23": "Avatars/zo_0m23.png",
  "mozyakin": "Avatars/mozyakin.jpg",
  "Bulkich": "Avatars/Bulkich.png",
  "uebergoose": "Avatars/uebergoose.jpg",
  "fuurooshaa": "Avatars/fuurooshaa.png",
  "mden1ss": "Avatars/mden1ss.png",
  "aut0mat1clol": "Avatars/aut0mat1clol.jpg",
  "nimaruichi_": "Avatars/nimaruichi_.jpg",
  "WenKlase": "Avatars/WenKlase.png",
  "UNIKNOW": "Avatars/UNIKNOW.png",
  "Zawardo10": "Avatars/Zawardo10.jpg",
  "bloods1de": "Avatars/bloods1de.jpg",
  "boldnessman": "Avatars/boldnessman.png",
  "Soupsake": "Avatars/Soupsake.jpg",
  "Destiny": "Avatars/Destiny.jpg",
  "Бeгимот": "Avatars/Бегимот.jpg"
};

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return escapeHtml(s); }

function avatarHtml(name){
  const url = PLAYER_AVATARS[name] || '';
  const initial = escapeHtml((name||'?')[0].toUpperCase());
  if(!url) return initial;
  return `<img src="${escapeAttr(url)}" alt="${escapeAttr(name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${initial}'))">`;
}
function avatarDiv(name, extraClass=''){
  return `<div class="player-avatar ${extraClass}">${avatarHtml(name)}</div>`;
}

function csvUrl(gid){ return `https://docs.google.com/spreadsheets/d/e/${SHEET_PUB_ID}/pub?gid=${gid}&single=true&output=csv`; }

function parseCSV(text){
  const rows=[]; let row=[], cur='', inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(inQ){ if(c=='"' && n=='"'){cur+='"';i++;} else if(c=='"'){inQ=false;} else cur+=c; }
    else { if(c=='"'){inQ=true;} else if(c==','){row.push(cur);cur='';} else if(c=='\n'){row.push(cur);rows.push(row);row=[];cur='';} else if(c=='\r'){ } else cur+=c; }
  }
  if(cur!==''||row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* ===== THEME ===== */
function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('amnyam_theme', theme);
}
function initTheme(){
  const saved = localStorage.getItem('amnyam_theme');
  if(saved){ setTheme(saved); return; }
  if(window.matchMedia('(prefers-color-scheme: dark)').matches){ setTheme('dark'); return; }
  setTheme('light');
}

/* ===== CACHE SYSTEM ===== */
const CACHE_KEY = 'amnyam_geg_cache_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function saveCache(){
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), version: CACHE_KEY, PLAYER_GAMES, STATS, STATS_TOTAL, PROGRESS_SEGMENTS, PROGRESS, liveOk }));
  } catch(e) { console.warn('Cache save failed:', e); }
}

function loadCache(){
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if(!raw) return null;
    const cache = JSON.parse(raw);
    return cache.version === CACHE_KEY ? cache : null;
  } catch(e) { console.warn('Cache load failed:', e); return null; }
}

function applyCache(cache){
  if(cache.PLAYER_GAMES) PLAYER_GAMES = cache.PLAYER_GAMES;
  if(cache.STATS) STATS = cache.STATS;
  if(cache.STATS_TOTAL) STATS_TOTAL = cache.STATS_TOTAL;
  if(cache.PROGRESS_SEGMENTS) PROGRESS_SEGMENTS = cache.PROGRESS_SEGMENTS;
  if(cache.PROGRESS) PROGRESS = cache.PROGRESS;
  if(cache.liveOk) liveOk = cache.liveOk;
}

function isCacheExpired(cache){ if(!cache) return true; return (Date.now() - cache.ts) > CACHE_TTL_MS; }

function cacheAgeText(cache){
  if(!cache) return 'нет кэша';
  const age = Date.now() - cache.ts;
  if(age < 60000) return 'только что';
  if(age < 3600000) return `${Math.floor(age/60000)} мин назад`;
  if(age < 86400000) return `${Math.floor(age/3600000)} ч назад`;
  return `${Math.floor(age/86400000)} дн назад`;
}

/* ===== PLACEHOLDER TEXT ===== */
const RULES_TOOLS_HTML = `<p class="muted" style="margin-top:14px">Инструменты: <a href="https://howlongtobeat.com/" target="_blank" rel="noopener">HowLongToBeat</a> • <a href="https://wheelofnames.com/" target="_blank" rel="noopener">Wheel of Names</a> • <a href="https://gamegauntlets.com/" target="_blank" rel="noopener">Steam Game Gauntlet</a> • <a href="https://livesplit.org/" target="_blank" rel="noopener">LiveSplit</a> • <a href="https://rutracker.org/" target="_blank" rel="noopener">RuTracker.org</a> • <a href="https://sourceforge.net/projects/dxwnd/" target="_blank" rel="noopener">DxWnd</a></p>`;

const RULES_FALLBACK_HTML = `<div class="rules-list">
<div class="rule-item">1. Порядок игр не подлежит тасовке.</div>
<div class="rule-item">2. Участнику даётся 5 рероллов игр, которые он может использовать на уже пройденные игры.</div>
<div class="rule-item">3. Лимит на прохождение игры — 33 часа. Если длиннее — легитимный реролл.</div>
<div class="rule-item">4. Игры участников — 10 игр, лимит 33 часа и остальные правила ивента.</div>
<div class="rule-item">5. Прокрут колеса должен быть показан. Иначе ролл нелегитимный.</div>
<div class="rule-item">6. <b>Игра считается пройденной:</b> а) финальные титры; б) основная ветка сюжета; в) если предыдущие невыполнимы — после уровня, где начинается зацикливание.</div>
<div class="rule-item">7. <b>Реролл без штрафов, если:</b> а) нет перевода на RU/EN; б) критичные баги / софтлоки; в) игра уже была пройдена на Амням GEG; г) визуальная новелла; д) эротика/порно; е) выпало DLC; ж) спорные случаи — на усмотрение; з) спортсимы, бессюжетные гонки.</div>
<div class="rule-item">8. Строго рероллятся игры, для прохождения которых необходимо побить Score.</div>
<div class="rule-item">9. Если игра слишком сложная / непроходимая — можно дропнуть. Участник откатывается на предыдущий отрезок.</div>
<div class="rule-item">10. Уровень сложности — выше самого первого. Если всего 2 уровня — любой.</div>
<div class="rule-item">11. Учёт времени — внутриигровое. Старт с «Новая игра», стоп по условиям из п.6.</div>
<div class="rule-item">12. Все спорные моменты решаются коллегиально.</div>
</div>` + RULES_TOOLS_HTML;

const PLACEHOLDER_GAMES = {};
PLAYERS.forEach(p => { PLACEHOLDER_GAMES[p] = ['Загрузка…']; });
const PLACEHOLDER_STATS = PLAYERS.map(p => ({ player: p, stage: '—', done: '—', prog: '—', drop: '—', reroll: '—' }));
const PLACEHOLDER_STATS_TOTAL = { stage: '—', done: '—', drop: '—', reroll: '—' };
const PLACEHOLDER_SEGMENTS = ['Отрезок 1', 'Отрезок 2', 'Отрезок 3'];
const PLACEHOLDER_PROGRESS = {};
PLAYERS.forEach(p => { PLACEHOLDER_PROGRESS[p] = ['—', '—', '—']; });

/* ===== STATE ===== */
let PLAYER_GAMES = {};
let STATS = [];
let STATS_TOTAL = {};
let PROGRESS_SEGMENTS = [];
let PROGRESS = {};
let playerRunCache = {};
let liveOk = {games:false, stats:false, progress:false, rules:false};

/* ===== TABS & EVENTS ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  document.getElementById('themeToggle')?.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  document.querySelectorAll('.tab[data-panel]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      showPanel(btn.dataset.panel);
      history.replaceState(null,'', location.pathname + (btn.dataset.panel!=='intro' ? '#'+btn.dataset.panel : ''));
    })
  });
  document.getElementById('refreshAllBtn')?.addEventListener('click', async ()=>{
    playerRunCache = {};
    setLiveStatus('Обновление…', 'warn');
    await boot(true);
  });
  document.getElementById('pRefreshBtn')?.addEventListener('click', ()=> { if(playerProfileName) loadPlayerRun(playerProfileName, true); });
  document.querySelectorAll('.subtab').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('psub-run').style.display = b.dataset.psub==='run' ? '' : 'none';
      document.getElementById('psub-pool').style.display = b.dataset.psub==='pool' ? '' : 'none';
    })
  });
  document.querySelector('[data-panel="stats"]')?.addEventListener('click', ()=> lastPlayerList='stats');
  document.querySelector('[data-panel="players"]')?.addEventListener('click', ()=> lastPlayerList='players');

  boot();
});

function showPanel(name, showPlayerTab=false){
  document.querySelectorAll('.tab[data-panel]').forEach(b=>b.classList.toggle('active', b.dataset.panel===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id==='panel-'+name));
  document.getElementById('playerTabBtn').style.display = showPlayerTab ? '' : 'none';
  window.scrollTo({top:190,behavior:'smooth'});
}
function setLiveStatus(text, mode=''){
  const el = document.getElementById('liveStatus');
  if(!el) return;
  el.textContent = text;
  el.className = mode;
}

/* ===== LIVE LOADERS ===== */
async function fetchCsv(gid, timeoutMs=6000){
  const controller = new AbortController();
  const t = setTimeout(()=>controller.abort(), timeoutMs);
  try{
    const r = await fetch(csvUrl(gid), {cache:'no-store', signal: controller.signal});
    clearTimeout(t);
    if(!r.ok) throw new Error(r.status);
    const txt = await r.text();
    if(txt.includes('Page Not Found')||txt.includes('Sorry, unable')) throw new Error('not public');
    return parseCSV(txt);
  } catch(e){ clearTimeout(t); throw e; }
}

async function loadGamesPool(){
  try{
    const rows = await fetchCsv(GIDS["Игры участников"]);
    const collected = {}; PLAYERS.forEach(p=>collected[p]=[]);
    for(let r=0; r<rows.length; r++){
      const header = rows[r].map(c=> (c||'').trim());
      const foundPlayers = header.map((h,i)=> PLAYERS.includes(h) ? {name:h, col:i} : null).filter(Boolean);
      if(foundPlayers.length === 0) continue;
      for(let gr = r+1; gr < rows.length && gr < r+20; gr++){
        const grow = rows[gr];
        if(grow.some(c => PLAYERS.includes((c||'').trim()))) break;
        let anyGame = false;
        for(const {name, col} of foundPlayers){
          if(collected[name].length >= 10) continue;
          const val = (grow[col] || '').trim();
          if(val && val !== '...' && !val.startsWith('...')){
            if(!collected[name].includes(val)){ collected[name].push(val); anyGame = true; }
          }
        }
        if(!anyGame){
          const nextRow = rows[gr+1] || [];
          if(nextRow.every(c => !(c||'').trim())) break;
        }
      }
    }
    let filledCount = 0;
    for(const p of PLAYERS){
      collected[p] = collected[p].slice(0,10);
      if(collected[p].length >= 5) filledCount++;
    }
    if(filledCount >= 10){
      for(const p of PLAYERS){
        const live = collected[p] || [];
        while(live.length < 10) live.push('Ещё не указано');
        collected[p] = live.slice(0,10);
      }
      PLAYER_GAMES = collected;
      liveOk.games = true;
    }
    const totalGames = Object.values(PLAYER_GAMES).reduce((a,b)=>a+b.length,0);
    document.getElementById('gamesSourceNote').textContent = `Пул игр: ${liveOk.games ? 'Google Sheets (live)' : 'кэш'} • ${totalGames} игр`;
  }catch(e){
    console.warn('games pool load failed', e);
    document.getElementById('gamesSourceNote').textContent = `Пул игр: кэш (${cacheAgeText(loadCache())})`;
  }
  initWheel();
}

async function loadStats(){
  try{
    const rows = await fetchCsv(GIDS["Статистика"]);
    const out=[];
    for(let i=1;i<rows.length;i++){
      const r=rows[i];
      if(!r[1] || r[1].startsWith('Общее')) break;
      out.push({ player: r[1].trim(), stage: parseInt(r[2])||0, done: parseInt(r[3])||0, prog: parseInt(r[4])||0, drop: parseInt(r[5])||0, reroll: parseInt(r[6])||0 });
    }
    if(out.length){ STATS = out; liveOk.stats = true; }
    const last = rows.find(r=> (r[1]||'').includes('Общее'));
    if(last){ STATS_TOTAL = {stage:last[2], done:last[3], drop:last[5], reroll:last[6]} }
  }catch(e){ console.warn('stats load failed', e); }
  renderStats();
}

async function loadProgress(){
  try{
    const rows = await fetchCsv(GIDS["Общий прогресс"]);
    const segRow = rows[2] || [];
    const segs = segRow.slice(1).filter(s=>s && s.trim()).map(s=>s.replace(/\n/g,' ').trim());
    if(segs.length){
      PROGRESS_SEGMENTS = segs;
      const prog = {};
      for(let i=3;i<rows.length;i++){
        const r = rows[i]; const name = (r[0]||'').trim();
        if(!name || !PLAYERS.includes(name)) continue;
        prog[name] = r.slice(1, 1+PROGRESS_SEGMENTS.length).map(v => (v||'').trim());
      }
      if(Object.keys(prog).length){ PROGRESS = prog; liveOk.progress = true; }
    }
  }catch(e){ console.warn('progress load failed', e); }
  renderProgress();
}

async function loadRules(){
  try{
    const rows = await fetchCsv(GIDS["Правила"]);
    const ruleLines = [];
    rows.forEach(r=>{ r.forEach(cell=>{
      if(!cell) return;
      const t = cell.trim();
      if(t.length>15 && !t.includes('«') && !t.includes('HowLongToBeat')) ruleLines.push(t);
    })});
    const uniq = [...new Set(ruleLines)].filter(t=>t.length>15).slice(0,40);
    if(uniq.length){
      let html = '<div class="rules-list">';
      uniq.forEach(t=>{ html += `<div class="rule-item">${escapeHtml(t)}</div>` });
      html += '</div>';
      document.getElementById('rulesContent').innerHTML = html + '<p class="muted" style="margin-top:14px">Инструменты: HowLongToBeat • Wheel of Names • Steam Game Gauntlet • LiveSplit • RuTracker.org • DxWnd</p>';
      liveOk.rules = true; return;
    }
    throw new Error('no rules');
  }catch(e){ document.getElementById('rulesContent').innerHTML = RULES_FALLBACK_HTML; }
}

/* ===== RENDERERS ===== */
function renderStats(){
  const grid = document.getElementById('statsGrid'); if(!grid) return;
  if(!STATS.length){ grid.innerHTML='<span class="muted">Нет данных</span>'; return;}
  grid.innerHTML='';
  STATS.forEach((s,i)=>{
    const div=document.createElement('div');
    div.className='stat-card';
    div.innerHTML = `${avatarDiv(s.player)}<div><div class="stat-rank">#${i+1}</div><b>${escapeHtml(s.player)}</b><br>Этап: ${s.stage} • Пройдено: ${s.done}<br><span class="muted">Дроп: ${s.drop} • Реролл: ${s.reroll}</span></div>`;
    div.onclick = ()=> openPlayerProfile(s.player);
    grid.appendChild(div);
  });
  const st = document.getElementById('statsTotal');
  if(st) st.textContent = STATS_TOTAL.done ? `Общее: этап ${STATS_TOTAL.stage} • пройдено ${STATS_TOTAL.done} • дропов ${STATS_TOTAL.drop} • рероллов ${STATS_TOTAL.reroll}` : '';
}

function renderProgress(){
  const pt = document.getElementById('progressTable'); if(!pt) return;
  if(!PROGRESS_SEGMENTS.length){ pt.innerHTML=''; const pn=document.getElementById('progressNote'); if(pn) pn.textContent='Нет данных'; return;}
  let head = '<tr><th>Игрок</th>';
  PROGRESS_SEGMENTS.forEach((seg,i)=>{ head += `<th>${escapeHtml(seg)}<br><span style="color:#8aa57a">#${i+1}</span></th>` });
  head += '</tr>';
  let body='';
  Object.keys(PROGRESS).forEach(player=>{
    body += `<tr style="cursor:pointer" onclick="openPlayerProfile('${player.replace(/'/g,"\\'")}')"><td><div class="progress-player-cell">${avatarDiv(player)} ${escapeHtml(player)}</div></td>`;
    for(let i=0;i<PROGRESS_SEGMENTS.length;i++){
      const v = (PROGRESS[player]||[])[i] || '';
      let cls='b-empty', txt='…';
      if(v.includes('Пройдено')){cls='b-done';txt='✓'}
      else if(v.includes('процесс')){cls='b-prog';txt='▶'}
      body += `<td class="${cls}">${txt}</td>`;
    }
    body += `</tr>`;
  });
  pt.innerHTML = head + body;
  const pn=document.getElementById('progressNote');
  if(pn) pn.textContent = `Нейтральные отрезки и именные. Клик по игроку — профиль.`;
}

function renderIntroStats(){
  const el = document.getElementById('introStats'); if(!el || !STATS.length) return;
  const totalPlayers = PLAYERS.length;
  const totalPool = Object.values(PLAYER_GAMES).reduce((a,b)=>a+b.length,0);
  const totalDone = STATS_TOTAL.done || STATS.reduce((a,s)=>a+s.done,0);
  const leader = STATS[0];
  el.innerHTML = `
    <li><b>${totalPlayers}</b> участников</li>
    <li><b>${totalPool}</b> игр в пуле участников</li>
    <li><b>${totalDone}</b> игр пройдено всего</li>
    <li>Лидер: <b>${escapeHtml(leader.player)}</b> — ${leader.stage} этап, ${leader.done} пройдено</li>
    <li><b>${STATS_TOTAL.reroll || STATS.reduce((a,s)=>a+s.reroll,0)}</b> рероллов на всех</li>
  `;
}

/* ===== WHEEL ===== */
let wheelInitialized = false;
function initWheel(){
  const playerSelect = document.getElementById('playerSelect'); if(!playerSelect) return;
  playerSelect.innerHTML='';
  PLAYERS.forEach(p=>{ const o=document.createElement('option'); o.value=p; o.textContent=p; playerSelect.appendChild(o); });
  playerSelect.onchange = e=> openWheelPlayer(e.target.value);
  if(!wheelInitialized){
    document.getElementById('spinBtn')?.addEventListener('click', spinWheel);
    wheelInitialized=true;
  }
  openWheelPlayer(PLAYERS[0]);
  renderPlayersGrid();
}
let currentWheelPlayer = PLAYERS[0];
let lastWinner = -1;
function openWheelPlayer(name){
  currentWheelPlayer = name; lastWinner = -1;
  const sel = document.getElementById('playerSelect'); if(sel) sel.value = name;
  renderWheelList(name);
  const sr = document.getElementById('spinResult');
  if(sr) sr.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><div class="player-avatar lg">${avatarHtml(name)}</div><div><div class="big">${escapeHtml(name)}</div><p class="muted">Нажми «Крутить!»</p></div></div>`;
}
function renderWheelList(name){
  const tbody = document.querySelector('#gamesTable tbody'); if(!tbody) return;
  tbody.innerHTML='';
  (PLAYER_GAMES[name]||[]).forEach((g,i)=>{
    const tr=document.createElement('tr');
    if(i===lastWinner) tr.className='winner';
    tr.innerHTML=`<td>${i+1}</td><td>${escapeHtml(g)}</td>`;
    tbody.appendChild(tr);
  });
  drawWheel(PLAYER_GAMES[name]||[]);
}
const canvas = document.getElementById('wheel');
const ctx = canvas ? canvas.getContext('2d') : null;
let currentAngle = 0;
function drawWheel(items){
  if(!ctx) return;
  const n = items.length || 10;
  const cx=180, cy=180, r=170;
  ctx.clearRect(0,0,360,360);
  for(let i=0;i<n;i++){
    const a0 = currentAngle + i * 2*Math.PI/n - Math.PI/2;
    const a1 = a0 + 2*Math.PI/n;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a1); ctx.closePath();
    ctx.fillStyle = i%2 ? '#8bd150' : '#b7ea7e';
    ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0 + Math.PI/n);
    ctx.textAlign='right'; ctx.fillStyle='#1e3b0f'; ctx.font='bold 12px Nunito';
    ctx.fillText((items[i]||'').slice(0,28), r-12, 4); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx,cy,42,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  ctx.fillStyle='#2b6412'; ctx.font='900 13px Nunito'; ctx.textAlign='center'; ctx.fillText('АМ НЯМ', cx, cy+4);
}
let spinning = false;
function spinWheel(){
  if(spinning) return;
  const name = currentWheelPlayer;
  const list = PLAYER_GAMES[name] || [];
  if(!list.length) return;
  spinning = true;
  const winnerIndex = Math.floor(Math.random()*list.length);
  lastWinner = winnerIndex;
  const segmentAngle = 360 / list.length;
  const currentDeg = currentAngle * 180 / Math.PI;
  const currentMod = ((currentDeg % 360) + 360) % 360;
  const winnerAngle = 360 - winnerIndex * segmentAngle - segmentAngle/2;
  const delta = (winnerAngle - currentMod + 360) % 360;
  const targetDeg = currentDeg + 360 * 5 + delta;
  const start = performance.now();
  const duration = 2600;
  const startAngle = currentDeg;
  function easeOut(t){ return 1 - Math.pow(1-t,3) }
  function frame(now){
    const t = Math.min(1, (now-start)/duration);
    const deg = startAngle + (targetDeg - startAngle) * easeOut(t);
    currentAngle = deg * Math.PI/180;
    drawWheel(list);
    if(t<1){ requestAnimationFrame(frame)} else {
      spinning=false;
      renderWheelList(name);
      const game = list[winnerIndex];
      const sr = document.getElementById('spinResult');
      if(sr) sr.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div class="player-avatar">${avatarHtml(name)}</div><div style="font-size:13px;color:#4a7c27;font-weight:800">${escapeHtml(name)}</div></div>
        <div class="big">${escapeHtml(game)}</div>
        <span class="tag">Выпало #${winnerIndex+1}</span><span class="tag">Amnyam GEG</span>`;
      history.replaceState(null,'','#roll='+encodeURIComponent(name)+':'+winnerIndex);
    }
  }
  requestAnimationFrame(frame);
}
function shufflePlayer(){ openWheelPlayer(PLAYERS[Math.floor(Math.random()*PLAYERS.length)]) }
function openWheelFor(name){ showPanel('games'); openWheelPlayer(name); }
function copyWheelLink(){
  const url = location.origin + location.pathname + '#roll=' + encodeURIComponent(currentWheelPlayer) + ':' + lastWinner;
  navigator.clipboard.writeText(url).then(()=>alert('Ссылка скопирована!')).catch(()=>prompt('Скопируй:', url));
}

/* ===== PLAYERS GRID ===== */
function renderPlayersGrid(){
  const grid = document.getElementById('playersGrid'); if(!grid) return;
  grid.innerHTML='';
  PLAYERS.forEach(name=>{
    const stat = STATS.find(s=>s.player===name);
    const el = document.createElement('div');
    el.className='player-card';
    el.innerHTML = `${avatarDiv(name)}<div><div class="player-name">${escapeHtml(name)}</div><div class="player-meta">${stat ? `Этап ${stat.stage} • ✓ ${stat.done}` : '—'}</div></div>`;
    el.onclick = ()=> openPlayerProfile(name);
    grid.appendChild(el);
  });
  const pc = document.getElementById('playerCount'); if(pc) pc.textContent = PLAYERS.length;
}

/* ===== PLAYER PROFILE ===== */
let playerProfileName = '';
let lastPlayerList = 'players';
async function openPlayerProfile(name){
  playerProfileName = name;
  const pn = document.getElementById('pName'); if(pn) pn.textContent = name;
  const pa = document.getElementById('pAvatar');
  if(pa){ pa.className='profile-avatar'; pa.innerHTML = avatarHtml(name); }
  const poolName = document.getElementById('poolPlayerName'); if(poolName) poolName.textContent = name;
  showPanel('player', true);
  const tabBtn = document.getElementById('playerTabBtn');
  if(tabBtn){ tabBtn.textContent = name; tabBtn.onclick = ()=> showPanel('player', true); }
  const st = STATS.find(s=>s.player===name);
  const ps = document.getElementById('pStats');
  if(ps) ps.innerHTML = st ? `<span class="pill">Этап <b>${st.stage}</b></span><span class="pill">Пройдено <b>${st.done}</b></span><span class="pill">Дроп <b>${st.drop}</b></span><span class="pill">Реролл <b>${st.reroll}</b></span>` : '<span class="muted">Статистика загружается…</span>';
  const pSub = document.getElementById('pSubtitle');
  if(pSub) pSub.textContent = st ? `Этап ${st.stage} • ${st.done} пройдено` : '';
  const poolTbody = document.querySelector('#poolTable tbody');
  if(poolTbody) poolTbody.innerHTML = (PLAYER_GAMES[name]||[]).map((g,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(g)}</td></tr>`).join('') || '<tr><td colspan=2 class="muted">Нет данных</td></tr>';
  await loadPlayerRun(name);
}
function goBackFromProfile(){ showPanel(lastPlayerList === 'stats' ? 'stats' : 'players'); }

async function loadPlayerRun(name, force=false){
  const tbody = document.querySelector('#runTable tbody'); if(!tbody) return;
  if(playerRunCache[name] && !force){ renderRunTable(playerRunCache[name]); return; }
  tbody.innerHTML = '<tr><td colspan="7" class="muted">Загружаю из Google Sheets…</td></tr>';
  try{
    const rows = await fetchCsv(GIDS[name]);
    let hRow = -1;
    for(let i=0;i<Math.min(8, rows.length); i++){
      const r = rows[i].map(c=> (c||'').toLowerCase());
      if(r.some(x=>x.includes('игра')) && r.some(x=>x.includes('статус'))){ hRow=i; break; }
    }
    if(hRow===-1) hRow=1;
    const header = rows[hRow].map(c=> (c||'').toLowerCase());
    const col = keys => { for(const k of keys){ const idx = header.findIndex(h=>h.includes(k)); if(idx!==-1) return idx; } return -1; };
    const ci = { game: col(['игра','game']), status: col(['статус']), segment: col(['отрезок','segment']), time: col(['время','time']), comment: col(['комментар','comment']), score: col(['оценк','score']) };
    const runs=[];
    for(let i=hRow+1;i<rows.length;i++){
      const r = rows[i]; const game = (r[ci.game]||'').trim();
      if(!game || game === '...' || game.startsWith('...')) continue;
      runs.push({ game, status: (r[ci.status]||'').trim(), segment: (r[ci.segment]||'').trim(), time: (r[ci.time]||'').trim(), comment: (r[ci.comment]||'').trim(), score: (r[ci.score]||'').trim() });
      if(runs.length>60) break;
    }
    let totalTime = '';
    for(let i=0;i<Math.min(4, rows.length); i++){ const m = rows[i].join(' ').match(/(\d+:\d+:\d+)/); if(m){ totalTime = m[1]; break;} }
    const data = {runs, totalTime, live:true};
    playerRunCache[name] = data;
    renderRunTable(data);
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Live-профиль не загрузился (${escapeHtml(e.message)}). Открой сайт через http/https.</td></tr>`;
  }
}
function renderRunTable(data){
  const tbody = document.querySelector('#runTable tbody'); if(!tbody) return;
  if(!data.runs.length){ tbody.innerHTML='<tr><td colspan="7" class="muted">Пока пусто</td></tr>'; return;}
  tbody.innerHTML = data.runs.map((run,i)=>{
    const st = (run.status||'').toLowerCase();
    let cls='s-other', label = run.status || '—';
    if(st.includes('пройден')){cls='s-done'}
    else if(st.includes('процесс')){cls='s-prog'}
    else if(st.includes('дроп')){cls='s-drop'}
    else if(st.includes('рерол')){cls='s-reroll'}
    return `<tr><td>${i+1}</td><td><b>${escapeHtml(run.game)}</b></td><td><span class="status-badge ${cls}">${escapeHtml(label)}</span></td><td>${escapeHtml(run.segment)}</td><td class="run-time">${escapeHtml(run.time)}</td><td class="run-score">${escapeHtml(run.score)}</td><td class="run-comment">${escapeHtml(run.comment).slice(0,380)}</td></tr>`;
  }).join('');
  if(data.totalTime){ const ps = document.getElementById('pSubtitle'); if(ps && !ps.textContent.includes('Общее время')) ps.textContent += ` • Общее время: ${data.totalTime}`; }
}

/* expose */
window.openPlayerProfile = openPlayerProfile;
window.goBackFromProfile = goBackFromProfile;
window.shufflePlayer = shufflePlayer;
window.copyWheelLink = copyWheelLink;
window.openWheelFor = openWheelFor;
window.clearCache = function(){
  localStorage.removeItem(CACHE_KEY);
  alert('Кэш очищен. Перезагрузите страницу.');
};

/* ===== BOOT ===== */
async function boot(isRefresh=false){
  const cached = loadCache();

  if(!isRefresh && cached && !isCacheExpired(cached)){
    applyCache(cached);
    setLiveStatus(`Кэш (${cacheAgeText(cached)})`, 'warn');
    renderStats(); renderProgress(); renderIntroStats(); renderPlayersGrid(); initWheel();
    const rc = document.getElementById('rulesContent');
    if(!cached.liveOk?.rules && rc) rc.innerHTML = RULES_FALLBACK_HTML;
  } else if(!isRefresh && cached) {
    applyCache(cached);
    setLiveStatus(`Кэш устарел (${cacheAgeText(cached)})`, 'warn');
    renderStats(); renderProgress(); renderIntroStats(); renderPlayersGrid(); initWheel();
  } else if(!isRefresh) {
    PLAYER_GAMES = JSON.parse(JSON.stringify(PLACEHOLDER_GAMES));
    STATS = JSON.parse(JSON.stringify(PLACEHOLDER_STATS));
    STATS_TOTAL = {...PLACEHOLDER_STATS_TOTAL};
    PROGRESS_SEGMENTS = [...PLACEHOLDER_SEGMENTS];
    PROGRESS = JSON.parse(JSON.stringify(PLACEHOLDER_PROGRESS));
    renderStats(); renderProgress(); renderIntroStats(); renderPlayersGrid(); initWheel();
    const rc = document.getElementById('rulesContent'); if(rc) rc.innerHTML = RULES_FALLBACK_HTML;
    setLiveStatus('Первый запуск…', 'warn');
  }

  await Promise.allSettled([ loadGamesPool(), loadStats(), loadProgress(), loadRules() ]);
  if(Object.values(liveOk).some(Boolean)) saveCache();

  renderIntroStats(); renderPlayersGrid();

  const okCount = Object.values(liveOk).filter(Boolean).length;
  if(okCount >= 3) setLiveStatus('Live ✓', 'live');
  else if(okCount > 0) setLiveStatus('Live частично', 'warn');
  else if(cached) setLiveStatus(`Оффлайн • кэш ${cacheAgeText(cached)}`, 'offline');
  else setLiveStatus('Оффлайн • загрузка…', 'offline');

  const note = document.getElementById('liveNote');
  if(note){
    if(okCount) note.textContent = `Live: загружено ${okCount}/4 разделов.`;
    else if(cached) note.textContent = `Оффлайн — показаны кэшированные данные (${cacheAgeText(cached)}). Кэш обновится при подключении.`;
    else note.textContent = 'Оффлайн — показаны placeholder-данные.';
  }

  const hash = location.hash;
  if(hash.startsWith('#roll=')){
    const [p, idx] = decodeURIComponent(hash.slice(6)).split(':');
    if(PLAYER_GAMES[p]){ showPanel('games'); openWheelPlayer(p); lastWinner = parseInt(idx)||0; renderWheelList(p); }
  } else if(hash.startsWith('#player/')){ openPlayerProfile(decodeURIComponent(hash.slice(8))); }
  else if(hash.startsWith('#stats')){ showPanel('stats'); lastPlayerList='stats'; }
  else if(hash.startsWith('#progress')){ showPanel('progress'); }
  else if(hash.startsWith('#rules')){ showPanel('rules'); }
  else if(hash.startsWith('#players')){ showPanel('players'); }
  else if(hash.startsWith('#games')){ showPanel('games'); }
}
