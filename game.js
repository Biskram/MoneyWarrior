// ===== KONFIG =====

const STATS = [
  { id: 'STR', name: 'Siła',          icon: 'strength.png',   desc: 'Surowa moc ciosu.' },
  { id: 'END', name: 'Wytrzymałość',  icon: 'Durability.png', desc: 'Przyjmowanie obrażeń.' },
  { id: 'SPD', name: 'Szybkość',      icon: 'speed.png',      desc: 'Pierwszy krok i unik.' },
  { id: 'TAC', name: 'Taktyka',       icon: 'Tactics.png',    desc: 'Sprytne kontry.' },
  { id: 'STA', name: 'Kondycja',      icon: 'condition.png',  desc: 'Długa walka.' },
];

const COUNTERS_FOR = {
  STR: ['END','TAC'],
  END: ['SPD','TAC'],
  SPD: ['STR','STA'],
  STA: ['STR','END'],
  TAC: ['SPD','STA'],
};

const MAPS = [
  { id: 'water',   name: 'Źródło Wytrwałości', bg: 'Water.mp4',     buffStat: 'STA' },
  { id: 'fire',    name: 'Płonąca Arena',      bg: 'fire.mp4',      buffStat: 'STR' },
  { id: 'wind',    name: 'Wietrzne Szczyty',   bg: 'wind.mp4',      buffStat: 'SPD' },
  { id: 'forest',  name: 'Leśna Forteca',      bg: 'natural.mp4',   buffStat: 'END' },
  { id: 'storm',   name: 'Burza Myśli',        bg: 'lightning.mp4', buffStat: 'TAC' },
];

const MAP_THEMES = {
  water:  { accent: '#38bdf8', accent2: '#0ea5e9' },
  fire:   { accent: '#f97316', accent2: '#fb7185' },
  wind:   { accent: '#a5b4fc', accent2: '#38bdf8' },
  forest: { accent: '#4ade80', accent2: '#22c55e' },
  storm:  { accent: '#a855f7', accent2: '#ec4899' },
};

const LEVELS = [
  { id: 1, label: 'Poziom 1', slotMin: 1, slotMax: 2, poolMin: 1, poolMax: 2, winsFloor: 0 },
  { id: 2, label: 'Poziom 2', slotMin: 2, slotMax: 3, poolMin: 2, poolMax: 3, winsFloor: 2 },
  { id: 3, label: 'Poziom 3', slotMin: 3, slotMax: 5, poolMin: 3, poolMax: 5, winsFloor: 4 },
];

// zamiast „botów”
const NAMES = ['Gracz Demo1','Gracz Demo2','Gracz Demo3','Gracz Demo4','Gracz Demo5','Gracz Demo6'];

const HP_MAX             = 100;
const STAT_POINTS_TOTAL  = 10;
const POINT_POWER        = 10;

// ===== STAN =====

const player = { name: 'Ty', hp: HP_MAX, stats: {}, level: 1 };
const bot    = { name: '',   hp: HP_MAX, stats: {}, level: 1 };

let playerAllocation = { STR:0, END:0, SPD:0, TAC:0, STA:0 };

let consecutiveWins      = 0;
let currentLevelId       = 1;
let currentMatchLevelId  = 1;

let currentMap       = null;
let mapBuffPercent   = 0;
let poolMultiplier   = 1;
let stakePerPlayer   = 30;

let inAnimation      = false;

// fazy: 'idle' | 'playerRolled'
let phase            = 'idle';

let plannedRound = {
  playerStatId: null,
  playerMult:   1,
  botStatId:    null,
  botMult:      1,
};

// pokoje
let rooms       = [];
let currentRoom = null;
let nextRoomId  = 1;

// ===== DOM =====

// ekrany
const screenStart  = document.getElementById('screenStart');
const screenBuild  = document.getElementById('screenBuild');
const screenBattle = document.getElementById('screenBattle');

const startBtn          = document.getElementById('startBtn');
const buildBackBtn      = document.getElementById('buildBackBtn');
const buildConfirmBtn   = document.getElementById('buildConfirmBtn');
const rerollMapBtn      = document.getElementById('rerollMapBtn');
const demoLevelBtn      = document.getElementById('demoLevelBtn');
const buildStatsList    = document.getElementById('buildStatsList');
const pointsLeftEl      = document.getElementById('pointsLeft');
const levelBadgeEl      = document.getElementById('levelBadge');
const streakInfoEl      = document.getElementById('streakInfo');
const matchmakingInfoEl = document.getElementById('matchmakingInfo');
const buildMapVideoEl   = document.getElementById('buildMapVideo');
const buildMapNameEl    = document.getElementById('buildMapName');
const buildMapBuffEl    = document.getElementById('buildMapBuff');
const buildSkillMultEl  = document.getElementById('buildSkillMult');
const buildPointMultEl  = document.getElementById('buildPointMult');
const buildMapLevelChipEl = document.getElementById('buildMapLevelChip');
const buildSkillRangeEl   = document.getElementById('buildSkillRange');
const deathOverlayEl    = document.getElementById('deathOverlay');
const deathVideoEl      = document.getElementById('deathVideo');

// pokoje DOM
const roomsListEl    = document.getElementById('roomsList');
const createRoomBtn  = document.getElementById('createRoomBtn');

// HUD / zasady kontr (dół)
const roundInfoEl     = document.getElementById('roundInfo');
const mapNameEl       = document.getElementById('mapName');
const counterLegendEl = document.getElementById('counterLegend');
const counterRowEl    = document.getElementById('counterRow');
const battlePlayerLevelEl = document.getElementById('battlePlayerLevel');
const battleBotLevelEl    = document.getElementById('battleBotLevel');

// arena
const arenaBgEl       = document.getElementById('arenaBg');
const bigMapIcon      = document.getElementById('bigMapIcon');
const bigMapIconImg   = document.getElementById('bigMapIconImg');
const mapBonusEl      = document.getElementById('mapBonus');
const poolInfoEl      = document.getElementById('poolInfo');

const playerNameEl    = document.getElementById('playerName');
const botNameEl       = document.getElementById('botName');
const playerHpTextEl  = document.getElementById('playerHpText');
const botHpTextEl     = document.getElementById('botHpText');
const playerHpBarEl   = document.getElementById('playerHpBar');
const botHpBarEl      = document.getElementById('botHpBar');

const playerStatsStackEl = document.getElementById('playerStatsStack');
const botStatsStackEl    = document.getElementById('botStatsStack');

const playerSpriteEl  = document.getElementById('playerSprite');
const botSpriteEl     = document.getElementById('botSprite');

const centerVsEl      = document.getElementById('centerVs');
const centerAtkText   = document.getElementById('centerAtkText');
const centerDefText   = document.getElementById('centerDefText');
const centerDiffText  = document.getElementById('centerDiffText');

const playerFloatingDmg = document.getElementById('playerFloatingDmg');
const botFloatingDmg    = document.getElementById('botFloatingDmg');

const playerFrontValue  = document.getElementById('playerFrontValue');
const botFrontValue     = document.getElementById('botFrontValue');

// sloty + przyciski
const playerSlotEl     = document.getElementById('playerSlot');
const botSlotEl        = document.getElementById('botSlot');
const playerSlotIconEl = document.getElementById('playerSlotIcon');
const botSlotIconEl    = document.getElementById('botSlotIcon');
const playerSlotMultEl = document.getElementById('playerSlotMult');
const botSlotMultEl    = document.getElementById('botSlotMult');
const playerSlotStatEl = document.getElementById('playerSlotStat');
const botSlotStatEl    = document.getElementById('botSlotStat');

const rollBtn  = document.getElementById('rollBtn');
const resetBtn = document.getElementById('resetBtn');
const logBoxEl = document.getElementById('logBox');

// DEV
const devBonusBtn = document.getElementById('devBonusBtn');
const devWinBtn   = document.getElementById('devWinBtn');
const devLoseBtn  = document.getElementById('devLoseBtn');
const devDodgeBtn = document.getElementById('devDodgeBtn');

// UNIK
let dodgeBannerEl   = null;

// ===== HELPERY =====

const wait = ms => new Promise(res => setTimeout(res, ms));

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min,max) {
  return Math.floor(Math.random() * (max-min+1)) + min;
}

function getLevelConfig(levelId) {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0];
}

function computeLevelFromWins(wins) {
  if (wins >= 4) return 3;
  if (wins >= 2) return 2;
  return 1;
}

function levelStartWins(levelId) {
  if (levelId <= 1) return 0;
  if (levelId === 2) return 2;
  return 4;
}

function setLevelForDemo(levelId) {
  const target = Math.min(Math.max(levelId, 1), LEVELS.length);
  consecutiveWins = levelStartWins(target);
  currentLevelId = target;
  currentMatchLevelId = currentLevelId;
  poolMultiplier = rollPoolMultiplier(currentLevelId);
  rollMap(playerAllocation, currentLevelId);
  updateLevelUI();
}

// mnożnik slotu – zawsze 1–3
function rollSlotMultiplier() {
  return randomInt(1,3);
}

function rollPoolMultiplier(levelId = currentLevelId) {
  const cfg = getLevelConfig(levelId);
  return randomInt(cfg.poolMin, cfg.poolMax);
}

function currentSlotRange() {
  return { min: 1, max: 3 };
}

function showScreen(name) {
  screenStart.classList.remove('active');
  screenBuild.classList.remove('active');
  screenBattle.classList.remove('active');

  if (name === 'start')   screenStart.classList.add('active');
  if (name === 'build')   screenBuild.classList.add('active');
  if (name === 'battle')  screenBattle.classList.add('active');
}

function cloneAllocation() {
  return { ...playerAllocation };
}

function randomStats() {
  const stats = { STR:0, END:0, SPD:0, TAC:0, STA:0 };
  let left = STAT_POINTS_TOTAL;
  const keys = Object.keys(stats);
  while (left > 0) {
    const k = randomChoice(keys);
    stats[k] += 1;
    left--;
  }
  return stats;
}

function sumCounters(defenderStats, statId) {
  const counterIds = COUNTERS_FOR[statId] || [];
  let sum = 0;
  for (const id of counterIds) sum += defenderStats[id] || 0;
  return { counterIds, sum };
}

function highestStatId(stats) {
  let best = null, val = -1;
  for (const [k,v] of Object.entries(stats)) {
    if (v > val) { val = v; best = k; }
  }
  return best;
}

// ===== POKOJE =====

function ensureRoomsForLevel(levelId) {
  if (!rooms.length || rooms[0].level !== levelId) {
    rooms = [];
    for (let i = 0; i < 3; i++) {
      rooms.push({
        id: nextRoomId++,
        level: levelId,
        stake: (i+1) * 20,
        ownerName: randomChoice(NAMES),
      });
    }
    currentRoom = null;
  }
  renderRooms();
}

function renderRooms() {
  if (!roomsListEl) return;
  roomsListEl.innerHTML = '';

  const sameLevelRooms = rooms.filter(r => r.level === currentLevelId);
  if (!sameLevelRooms.length) {
    roomsListEl.innerHTML = '<div class="room-empty">Brak pokoi na tym poziomie. Stwórz swój.</div>';
    return;
  }

  sameLevelRooms.forEach(room => {
    const row = document.createElement('div');
    row.className = 'room-row' + (currentRoom && currentRoom.id === room.id ? ' active' : '');
    row.dataset.roomId = room.id;

    row.innerHTML = `
      <div class="room-main">
        <div class="room-name">Pokój #${room.id} • ${room.ownerName}</div>
        <div class="room-meta">Stawka: ${room.stake} pkt • Poziom ${room.level}</div>
      </div>
      <button class="secondary small" data-room-id="${room.id}">
        ${currentRoom && currentRoom.id === room.id ? 'Wybrany' : 'Wejdź'}
      </button>
    `;
    roomsListEl.appendChild(row);
  });
}

function selectRoomById(id) {
  const room = rooms.find(r => r.id === id);
  if (!room) return;
  currentRoom = room;
  stakePerPlayer = room.stake;
  renderRooms();
  if (buildConfirmBtn) buildConfirmBtn.disabled = !currentRoom;
}

// ===== HUD / LEVEL =====

function updateLevelUI() {
  currentLevelId = computeLevelFromWins(consecutiveWins);
  const cfg = getLevelConfig(currentLevelId);
  const nextLevel = LEVELS.find(l => l.id === currentLevelId + 1);

  if (levelBadgeEl) levelBadgeEl.textContent = cfg.label;

  if (streakInfoEl) {
    if (nextLevel) {
      const left = Math.max(0, nextLevel.winsFloor - consecutiveWins);
      streakInfoEl.textContent =
        `Wygrane z rzędu: ${consecutiveWins} / ${nextLevel.winsFloor} (brakuje ${left})`;
    } else {
      streakInfoEl.textContent = `Wygrane z rzędu: ${consecutiveWins} • max poziom`;
    }
  }

  if (matchmakingInfoEl) {
    matchmakingInfoEl.textContent = `Widzisz tylko pokoje graczy na poziomie ${cfg.id}.`;
  }

  if (buildMapLevelChipEl) buildMapLevelChipEl.textContent = cfg.label;
  if (buildSkillRangeEl)    buildSkillRangeEl.textContent = `Sloty x1–x3`;

  if (battlePlayerLevelEl) battlePlayerLevelEl.textContent = `Twój poziom: ${cfg.id}`;
  if (battleBotLevelEl) {
    const botLevelText = currentMatchLevelId || cfg.id;
    battleBotLevelEl.textContent = `Przeciwnik: poziom ${botLevelText}`;
  }

  ensureRoomsForLevel(cfg.id);
}

function setHpBars() {
  playerHpTextEl.textContent = `${player.hp} / ${HP_MAX} HP`;
  botHpTextEl.textContent    = `${bot.hp} / ${HP_MAX} HP`;
  playerHpBarEl.style.width  = `${(player.hp/HP_MAX)*100}%`;
  botHpBarEl.style.width     = `${(bot.hp/HP_MAX)*100}%`;
}

function setLog(text) {
  if (logBoxEl) logBoxEl.textContent = text;
}

function spawnFloatingDmg(side, amount) {
  const el = side === 'player' ? playerFloatingDmg : botFloatingDmg;
  el.textContent = amount > 0 ? `-${amount}` : '0';
  el.classList.remove('show');
  el.style.left   = side === 'player' ? '26%' : '74%';
  el.style.bottom = '64%';
  void el.offsetWidth;
  el.classList.add('show');

  const hpBar = side === 'player' ? playerHpBarEl : botHpBarEl;
  hpBar.classList.add('hit');
  setTimeout(()=>hpBar.classList.remove('hit'), 250);
}

function resetStatHighlights() {
  [...playerStatsStackEl.children, ...botStatsStackEl.children].forEach(el => {
    el.classList.remove('huge-atk','huge-def','bonus-pulse','shake');
    const atkNum = el.querySelector('.atk-num');
    if (atkNum && el.dataset.atkBase !== undefined) {
      atkNum.textContent = el.dataset.atkBase;
      atkNum.classList.remove('stat-num-boost');
    }
  });
  [...counterRowEl.children].forEach(el => el.classList.remove('active','shake'));
  [...counterLegendEl.querySelectorAll('span')].forEach(el => el.classList.remove('active'));
  centerVsEl.classList.remove('visible','bonus-pulse','shake');

  playerFrontValue.classList.remove('show');
  botFrontValue.classList.remove('show');
  playerFrontValue.textContent = '';
  botFrontValue.textContent    = '';
}

// powiększona liczba MOC + dymek x2
function showStatMultiplier(attackerSide, statId, mult) {
  const isPlayer = attackerSide === 'player';
  const stackEl  = isPlayer ? playerStatsStackEl : botStatsStackEl;
  const badge    = stackEl.querySelector(`[data-stat-id="${statId}"]`);
  if (!badge) return;

  const atkNumEl = badge.querySelector('.atk-num');
  if (!atkNumEl) return;

  const basePoints = (isPlayer ? player.stats[statId] : bot.stats[statId]) || 0;
  badge.dataset.atkBase = basePoints;
  atkNumEl.textContent  = basePoints * mult;
  atkNumEl.classList.add('stat-num-boost');

  const bubble = document.createElement('div');
  bubble.className = 'stat-mult-bubble';
  bubble.textContent = 'x' + mult;
  badge.appendChild(bubble);

  setTimeout(() => {
    bubble.classList.add('hide');
    setTimeout(() => bubble.remove(), 250);
  }, 1500);
}

function showFrontValues(attackerSide, atkValue, defValue) {
  const isPlayer = attackerSide === 'player';
  const atkEl = isPlayer ? playerFrontValue : botFrontValue;
  const defEl = isPlayer ? botFrontValue    : playerFrontValue;

  atkEl.innerHTML = `<img src="sword.png" alt=""> ${atkValue}`;
  defEl.innerHTML = `<img src="shield.png" alt=""> ${defValue}`;

  atkEl.classList.add('show');
  defEl.classList.add('show');
}

function highlightResetButton() {
  if (!resetBtn) return;
  resetBtn.classList.remove('cta-pulse');
  void resetBtn.offsetWidth;
  resetBtn.classList.add('cta-pulse');
}

// UNIK

function ensureDodgeBanner() {
  if (!dodgeBannerEl) {
    dodgeBannerEl = document.createElement('div');
    dodgeBannerEl.className = 'dodge-banner';
    dodgeBannerEl.textContent = 'UNIK!';
    document.querySelector('.arena-shell').appendChild(dodgeBannerEl);
  }
}

function showDodge() {
  ensureDodgeBanner();
  dodgeBannerEl.classList.remove('show');
  void dodgeBannerEl.offsetWidth;
  dodgeBannerEl.classList.add('show');

  const shakeEls = [
    ...document.querySelectorAll('.stat-badge'),
    ...document.querySelectorAll('.slot'),
    playerSpriteEl,
    botSpriteEl,
    bigMapIcon,
    centerVsEl,
  ].filter(Boolean);

  shakeEls.forEach(el => el.classList.add('shake'));
  setTimeout(() => {
    shakeEls.forEach(el => el.classList.remove('shake'));
  }, 900);
}

// animacja końca walki – pełny ekran
function playOutcomeAnimation(kind, onDone) {
  if (!deathOverlayEl || !deathVideoEl) {
    highlightResetButton();
    if (onDone) onDone();
    return;
  }

  const src = kind === 'win' ? 'Win_screen.mp4' : 'Smierc.mp4';
  deathOverlayEl.classList.add('show');
  deathVideoEl.pause();
  deathVideoEl.src = src;
  deathVideoEl.load();
  deathVideoEl.currentTime = 0;

  deathVideoEl.play().catch(() => {
    deathOverlayEl.classList.remove('show');
    highlightResetButton();
    if (onDone) onDone();
  });

  deathVideoEl.onended = () => {
    deathOverlayEl.classList.remove('show');
    highlightResetButton();
    if (onDone) onDone();
  };
}

// ===== BUILD UI =====

function renderBuildScreen() {
  buildStatsList.innerHTML = '';
  for (const stat of STATS) {
    const row = document.createElement('div');
    row.className = 'build-row';
    row.dataset.statId = stat.id;
    const buttons = Array.from({ length: 11 }, (_, i) => {
      return `<button class="value-btn" data-value="${i}">${i}</button>`;
    }).join('');

    row.innerHTML = `
      <img src="${stat.icon}" alt="${stat.name}">
      <div class="build-row-name">
        <span>${stat.name}</span>
        <span>${stat.desc}</span>
      </div>
      <div class="build-row-controls">
        ${buttons}
      </div>
    `;
    buildStatsList.appendChild(row);
  }
  updateBuildUI();
}

function openBuildScreen(resetPoints = false) {
  if (resetPoints) {
    playerAllocation = { STR:0, END:0, SPD:0, TAC:0, STA:0 };
  }
  renderBuildScreen();
  rollMap(playerAllocation, currentLevelId);
  updateLevelUI();
  showScreen('build');
}

function totalAllocated() {
  return Object.values(playerAllocation).reduce((a,b)=>a+b,0);
}

function updateBuildUI() {
  const left = STAT_POINTS_TOTAL - totalAllocated();
  pointsLeftEl.textContent = `Pozostało punktów: ${left}`;

  // Można wejść na arenę od razu, jeśli jest wybrany pokój
  buildConfirmBtn.disabled = !currentRoom;

  for (const row of buildStatsList.children) {
    const id = row.dataset.statId;
    const currentVal = playerAllocation[id];
    const totalWithout = totalAllocated() - currentVal;
    const maxForRow = STAT_POINTS_TOTAL - totalWithout;

    row.querySelectorAll('.value-btn').forEach(btn => {
      const val = Number(btn.dataset.value);
      btn.classList.toggle('active', val === currentVal);
      btn.disabled = val > maxForRow;
    });
  }
}

// ===== RENDER STATÓW NA ARENIE =====

function buildStatStacks() {
  playerStatsStackEl.innerHTML = '';
  botStatsStackEl.innerHTML    = '';

  for (const stat of STATS) {
    const p = document.createElement('div');
    p.className = 'stat-badge';
    p.dataset.statId = stat.id;
    p.innerHTML = `
      <img src="${stat.icon}" alt="${stat.name}">
      <div class="stat-num atk-num">${player.stats[stat.id] || 0}</div>
      <div class="stat-num def-num">${player.stats[stat.id] || 0}</div>
    `;
    playerStatsStackEl.appendChild(p);

    const b = document.createElement('div');
    b.className = 'stat-badge';
    b.dataset.statId = stat.id;
    b.innerHTML = `
      <img src="${stat.icon}" alt="${stat.name}">
      <div class="stat-num atk-num">${bot.stats[stat.id] || 0}</div>
      <div class="stat-num def-num">${bot.stats[stat.id] || 0}</div>
    `;
    botStatsStackEl.appendChild(b);
  }
}

function renderCounterRow() {
  counterRowEl.innerHTML = '';
  for (const stat of STATS) {
    const chip = document.createElement('div');
    chip.className = 'counter-chip';
    chip.dataset.statId = stat.id;
    chip.innerHTML = `
      <img src="${stat.icon}" alt="${stat.name}">
      <span>${stat.name}</span>
      <span>Ty: <span class="me">${player.stats[stat.id] || 0}</span></span>
      <span>|</span>
      <span>Przeciwnik: <span class="bot">${bot.stats[stat.id] || 0}</span></span>
    `;
    counterRowEl.appendChild(chip);
  }
}

function highlightForAttack(attackerSide, statId, defenderCounterIds) {
  resetStatHighlights();

  const atkStack = attackerSide === 'player' ? playerStatsStackEl : botStatsStackEl;
  const defStack = attackerSide === 'player' ? botStatsStackEl    : playerStatsStackEl;

  const atkBadge = atkStack.querySelector(`[data-stat-id="${statId}"]`);
  if (atkBadge) atkBadge.classList.add('huge-atk');

  defenderCounterIds.forEach(id => {
    const bdg = defStack.querySelector(`[data-stat-id="${id}"]`);
    if (bdg) bdg.classList.add('huge-def');
  });

  const chip = counterRowEl.querySelector(`[data-stat-id="${statId}"]`);
  if (chip) chip.classList.add('active');

  [...counterLegendEl.querySelectorAll('span')].forEach(el => {
    el.dataset.stat === statId
      ? el.classList.add('active')
      : el.classList.remove('active');
  });
}

// ===== SLOTY =====

function updateSlotsUnknown() {
  playerSlotStatEl.textContent = '?';
  playerSlotMultEl.textContent = 'x?';
  playerSlotIconEl.src         = 'strength.png';

  botSlotStatEl.textContent    = '?';
  botSlotMultEl.textContent    = 'x?';
  botSlotIconEl.src            = 'strength.png';
}

// losowanie: najpierw stat, potem mnożnik 1–3
async function spinSlot(slotEl, iconEl, statTextEl, multEl, targetStatId, targetMult, multRange = { min: 1, max: 3 }) {
  slotEl.classList.add('spin');
  const spins = 10;
  for (let i = 0; i < spins; i++) {
    const final = i === spins - 1;
    const stat = final ? STATS.find(s => s.id === targetStatId) : randomChoice(STATS);

    iconEl.src             = stat.icon;
    statTextEl.textContent = stat.name;
    multEl.textContent     = 'x?';

    const delay = 70 + i * 35;
    await wait(delay);
  }
  slotEl.classList.remove('spin');

  const realMult = Math.max(1, Math.min(3, targetMult));
  const steps = Math.max(4, 2 + realMult * 2);

  for (let i = 0; i < steps; i++) {
    const temp = randomInt(1,3);
    multEl.textContent = 'x' + temp;
    await wait(80);
  }
  multEl.textContent = 'x' + realMult;
}

// ===== MAPA =====

function rollMap(statsSource = playerAllocation, levelId = currentLevelId) {
  const bestId = highestStatId(statsSource);
  let pool = MAPS;

  if (bestId) {
    const fav    = MAPS.filter(m => m.buffStat === bestId);
    const others = MAPS.filter(m => m.buffStat !== bestId);
    const weighted = [];
    fav.forEach(m => weighted.push(m, m, m));
    weighted.push(...others);
    pool = weighted;
  }

  currentMap     = randomChoice(pool);
  mapBuffPercent = randomInt(10,35);
  poolMultiplier = rollPoolMultiplier(levelId);

  renderMapUI();
}

function applyThemeForCurrentMap() {
  if (!currentMap) return;
  const theme = MAP_THEMES[currentMap.id] || { accent: '#a855f7', accent2: '#ec4899' };
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent2', theme.accent2);
}

function renderMapUI() {
  if (!currentMap) return;
  const buffStat = STATS.find(s => s.id === currentMap.buffStat);
  const buffName = buffStat ? buffStat.name : 'statystyki';

  applyThemeForCurrentMap();

  if (arenaBgEl) {
    arenaBgEl.src = currentMap.bg;
    arenaBgEl.currentTime = 0;
    arenaBgEl.play().catch(()=>{});
  }

  if (buildMapVideoEl) {
    buildMapVideoEl.src = currentMap.bg;
  }

  bigMapIconImg.src = buffStat ? buffStat.icon : 'strength.png';

  mapNameEl.textContent  = currentMap.name;
  mapBonusEl.textContent = `Premia: +${mapBuffPercent}% do ${buffName}`;

  const totalPool = (stakePerPlayer * 2) * poolMultiplier;
  poolInfoEl.textContent = `Mnożnik puli: x${poolMultiplier} • Możliwa wygrana: ${totalPool} pkt`;

  if (buildMapNameEl) buildMapNameEl.textContent = currentMap.name;
  if (buildMapBuffEl) buildMapBuffEl.textContent = `Premia +${mapBuffPercent}% do ${buffName}`;

  const skillMultVal = (1 + mapBuffPercent / 100).toFixed(2);
  if (buildSkillMultEl) buildSkillMultEl.textContent = `x${skillMultVal}`;
  if (buildPointMultEl) buildPointMultEl.textContent = `x${poolMultiplier}`;
}

// ===== OBLICZANIE ATAKU =====

function computeAttack(attacker, defender, statId, roundMult) {
  const atkStats = attacker.stats;
  const defStats = defender.stats;
  const points   = atkStats[statId] || 0;

  const attackBasePoints = points * roundMult;

  const { counterIds, sum: rawCounterPoints } = sumCounters(defStats, statId);
  const defPoints = rawCounterPoints;

  let beforeBuffPoints = Math.max(0, attackBasePoints - defPoints);

  let buffApplied = false;
  let attackPointsWithBuff = attackBasePoints;

  if (currentMap && currentMap.buffStat === statId && beforeBuffPoints > 0) {
    buffApplied = true;
    attackPointsWithBuff = Math.round(
      attackBasePoints * (1 + mapBuffPercent / 100)
    );
  }

  const finalDmgPoints = Math.max(0, attackPointsWithBuff - defPoints);
  const finalDmgHp     = finalDmgPoints * POINT_POWER;

  return {
    points,
    attackBasePoints,
    attackPointsWithBuff,
    counterIds,
    counterPoints: rawCounterPoints,
    defPoints,
    buffApplied,
    beforeBuffPoints,
    finalDmgPoints,
    finalDmgHp,
  };
}

// BONUS MAPY

function showMapBonusVisual(bonusPoints) {
  const arenaShell = document.querySelector('.arena-shell');
  if (arenaShell) {
    const banner = document.createElement('div');
    banner.className = 'map-bonus-banner';
    banner.textContent = `BONUS MAPY +${bonusPoints} pkt`;
    arenaShell.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
  }

  const bonusEls = [
    ...document.querySelectorAll('.stat-badge'),
    ...document.querySelectorAll('.slot'),
    centerVsEl,
    bigMapIcon,
    playerSpriteEl,
    botSpriteEl,
  ].filter(Boolean);
  bonusEls.forEach(el => el.classList.add('bonus-pulse'));
  setTimeout(() => {
    bonusEls.forEach(el => el.classList.remove('bonus-pulse'));
  }, 2000);
}

// PREVIEW

async function animatePreview(attackerSide, statId, roundMult) {
  const isPlayer = attackerSide === 'player';
  const attacker = isPlayer ? player : bot;
  const defender = isPlayer ? bot : player;

  const res = computeAttack(attacker, defender, statId, roundMult);
  const atkStrongId = highestStatId(attacker.stats);

  const { counterIds } = sumCounters(defender.stats, statId);

  highlightForAttack(attackerSide, statId, counterIds);

  const spriteEl = isPlayer ? playerSpriteEl : botSpriteEl;
  if (atkStrongId === statId) {
    spriteEl.classList.add('hit-strong');
    setTimeout(()=>spriteEl.classList.remove('hit-strong'), 450);
  }

  showStatMultiplier(attackerSide, statId, roundMult);

  const atkPts = res.attackBasePoints;
  const defPts = res.defPoints;

  centerAtkText.textContent = isPlayer
    ? `Twoja moc: ${atkPts} pkt`
    : `Moc przeciwnika: ${atkPts} pkt`;
  centerDefText.textContent = isPlayer
    ? `Kontra przeciwnika: ${defPts} pkt`
    : `Twoja kontra: ${defPts} pkt`;
  centerDiffText.textContent = `MOC – KONTRA = ${Math.max(0, res.beforeBuffPoints)} pkt`;
  centerVsEl.classList.add('visible');

  showFrontValues(attackerSide, atkPts, defPts);

  if (res.buffApplied && res.beforeBuffPoints > 0) {
    await wait(400);

    const bonusPts = Math.max(0, res.attackPointsWithBuff - res.attackBasePoints);
    const buffedAtk = res.attackPointsWithBuff;
    const buffedDiff = Math.max(0, buffedAtk - defPts);

    centerAtkText.textContent  = isPlayer
      ? `Twoja moc z premią mapy: ${buffedAtk} pkt`
      : `Moc przeciwnika z premią mapy: ${buffedAtk} pkt`;
    centerDiffText.textContent = `BONUS MAPY +${bonusPts} pkt • MOC – KONTRA = ${buffedDiff} pkt`;
    showFrontValues(attackerSide, buffedAtk, defPts);

    showMapBonusVisual(bonusPts || 1);
  }

  await wait(1500);
  return res;
}

// ANIMACJA ATAKU

async function animateSingleAttack(attackerSide, statId, roundMult) {
  const isPlayer = attackerSide === 'player';
  const attacker = isPlayer ? player : bot;
  const defender = isPlayer ? bot : player;

  const res   = computeAttack(attacker, defender, statId, roundMult);
  const atkStrongId = highestStatId(attacker.stats);

  const { counterIds } = sumCounters(defender.stats, statId);

  highlightForAttack(attackerSide, statId, counterIds);
  centerVsEl.classList.remove('visible');

  const spriteEl = isPlayer ? playerSpriteEl : botSpriteEl;
  if (atkStrongId === statId) {
    spriteEl.classList.add('hit-strong');
    setTimeout(()=>spriteEl.classList.remove('hit-strong'), 450);
  }

  let dodged = false;
  if (defender.hp < 30 && randomInt(1,3) === 1) {
    dodged = true;
  }

  let dmgToApplyHp;
  let atkPts, defPts;

  if (dodged) {
    dmgToApplyHp = 0;
    atkPts = res.attackPointsWithBuff;
    defPts = res.defPoints;
    showDodge();
    centerAtkText.textContent = isPlayer
      ? `Twoja moc: ${atkPts} pkt`
      : `Moc przeciwnika: ${atkPts} pkt`;
    centerDefText.textContent = isPlayer
      ? `UNIK! Twoja kontra niepotrzebna`
      : `UNIK! Kontra przeciwnika niepotrzebna`;
    centerDiffText.textContent = `0 obrażeń – czysty unik`;
    centerVsEl.classList.add('visible');
    showFrontValues(attackerSide, atkPts, defPts);
  } else {
    dmgToApplyHp = res.finalDmgHp;
    atkPts = res.attackPointsWithBuff;
    defPts = res.defPoints;

    const dmgPoints = res.finalDmgPoints;

    centerAtkText.textContent = isPlayer
      ? `Twoja moc: ${atkPts} pkt`
      : `Moc przeciwnika: ${atkPts} pkt`;
    centerDefText.textContent = isPlayer
      ? `Kontra przeciwnika: ${defPts} pkt`
      : `Twoja kontra: ${defPts} pkt`;

    if (dmgToApplyHp <= 0) {
      centerDiffText.textContent = `OBRONA – wszystko zablokowane`;
    } else {
      centerDiffText.textContent = isPlayer
        ? `Zadałeś ${dmgToApplyHp} dmg (${dmgPoints} pkt)`
        : `Dostałeś ${dmgToApplyHp} dmg (${dmgPoints} pkt)`;
    }
    centerVsEl.classList.add('visible');
    showFrontValues(attackerSide, atkPts, defPts);
  }

  setLog(isPlayer ? 'Twój atak kontra obrona przeciwnika…' : 'Atak przeciwnika kontra Twoja obrona…');

  await wait(1500);

  if (!dodged && dmgToApplyHp > 0) {
    defender.hp = Math.max(0, defender.hp - dmgToApplyHp);
    setHpBars();

    const hitSprite = isPlayer ? botSpriteEl : playerSpriteEl;
    if (hitSprite) {
      hitSprite.classList.add('shake');
      setTimeout(() => hitSprite.classList.remove('shake'), 450);
    }

    spawnFloatingDmg(isPlayer ? 'bot' : 'player', dmgToApplyHp);
  } else {
    spawnFloatingDmg(isPlayer ? 'bot' : 'player', 0);
  }

  await wait(900);
  centerVsEl.classList.remove('visible');
  resetStatHighlights();

  return dmgToApplyHp;
}

// SEKWENCJA TURY

async function playTurnAfterPlayerRoll() {
  if (inAnimation || phase !== 'playerRolled') return;
  inAnimation = true;
  if (rollBtn) rollBtn.disabled = true;

  const { playerStatId, playerMult } = plannedRound;

  roundInfoEl.textContent = `Atakujesz`;
  await animateSingleAttack('player', playerStatId, playerMult);
  if (bot.hp <= 0) {
    endBattle('player');
    inAnimation = false;
    return;
  }

  const bStat = randomChoice(STATS);
  const bMult = rollSlotMultiplier();
  plannedRound.botStatId = bStat.id;
  plannedRound.botMult   = bMult;

  await spinSlot(
    botSlotEl, botSlotIconEl, botSlotStatEl, botSlotMultEl,
    bStat.id, bMult, currentSlotRange()
  );

  roundInfoEl.textContent = `Przeciwnik losuje atak`;
  setLog('Przeciwnik losuje swój atak…');
  await animatePreview('bot', bStat.id, bMult);

  roundInfoEl.textContent = `Przeciwnik atakuje`;
  await animateSingleAttack('bot', bStat.id, bMult);
  if (player.hp <= 0) {
    endBattle('bot');
    inAnimation = false;
    return;
  }

  await wait(400);
  prepareNextTurn();
  inAnimation = false;
}

// KONIEC WALKI

function endBattle(winner) {
  if (rollBtn) rollBtn.disabled = true;

  const basePool = stakePerPlayer * 2;
  const totalPool= basePool * poolMultiplier;
  let logMsg = '';

  if (winner === 'player') {
    roundInfoEl.textContent = 'Koniec walki – WYGRAŁEŚ!';
    logMsg = `Zgarniasz całą pulę: ${totalPool} pkt.`;
    playOutcomeAnimation('win', () => showScreen('start'));
  } else if (winner === 'bot') {
    roundInfoEl.textContent = 'Koniec walki – przeciwnik wygrywa.';
    logMsg = `Przeciwnik zgarnia ${totalPool} pkt. Spróbuj jeszcze raz.`;
    playOutcomeAnimation('lose', () => showScreen('start'));
  } else {
    roundInfoEl.textContent = 'Koniec walki – remis.';
    logMsg = `Nikt nie zgarnia puli ${totalPool} pkt.`;
    highlightResetButton();
  }

  const progressNote = applyMatchResult(winner);
  if (progressNote) logMsg += ` ${progressNote}`;
  setLog(logMsg.trim());

  phase = 'idle';
}

function applyMatchResult(winner) {
  const prevLevel = currentLevelId;

  if (winner === 'player') {
    const maxWinsTrack = LEVELS[LEVELS.length - 1].winsFloor + 2;
    consecutiveWins = Math.min(consecutiveWins + 1, maxWinsTrack);
  } else if (winner === 'bot') {
    const dropTo = Math.max(1, currentMatchLevelId - 1);
    consecutiveWins = levelStartWins(dropTo);
  }

  currentLevelId = computeLevelFromWins(consecutiveWins);
  updateLevelUI();

  if (currentLevelId > prevLevel) {
    const cfg = getLevelConfig(currentLevelId);
    return `Awans! Wchodzisz na ${cfg.label} (sloty x1–x3).`;
  }
  if (currentLevelId < prevLevel) {
    const cfg = getLevelConfig(currentLevelId);
    return `Spadasz na ${cfg.label}.`;
  }
  return '';
}

// LOSUJ ATAK

async function rollPlayerAttack() {
  if (inAnimation || phase !== 'idle') return;
  inAnimation = true;
  if (rollBtn) rollBtn.disabled = true;
  resetStatHighlights();
  centerVsEl.classList.remove('visible');

  const pStat = randomChoice(STATS);
  const pMult = rollSlotMultiplier();

  plannedRound.playerStatId = pStat.id;
  plannedRound.playerMult   = pMult;

  setLog('Losujesz swój atak – koło się kręci…');

  await spinSlot(
    playerSlotEl, playerSlotIconEl, playerSlotStatEl, playerSlotMultEl,
    pStat.id, pMult, currentSlotRange()
  );

  roundInfoEl.textContent = `Podgląd Twojej mocy`;
  await animatePreview('player', pStat.id, pMult);

  roundInfoEl.textContent = `Kliknij „Atakuj”`;
  setLog('Masz swój atak. Kliknij „Atakuj”.');

  if (rollBtn) {
    rollBtn.textContent = 'Atakuj';
    rollBtn.disabled = false;
  }
  phase = 'playerRolled';
  inAnimation = false;
}

function prepareNextTurn() {
  updateSlotsUnknown();
  resetStatHighlights();
  centerVsEl.classList.remove('visible');
  if (rollBtn) {
    rollBtn.disabled = false;
    rollBtn.textContent = 'Losuj atak';
  }
  setLog('Losuj nowy atak na kolejną turę.');
  phase = 'idle';
}

// START WALKI

function startBattleWithCurrentAllocation() {
  player.stats = cloneAllocation();
  bot.stats    = randomStats();

  currentMatchLevelId = currentLevelId;
  player.level = currentMatchLevelId;
  bot.level    = currentMatchLevelId;

  player.hp = HP_MAX;
  bot.hp    = HP_MAX;

  player.name = 'Ty';

  if (currentRoom) {
    stakePerPlayer = currentRoom.stake;
    bot.name = currentRoom.ownerName;
  } else {
    bot.name = randomChoice(NAMES);
  }

  playerNameEl.textContent = player.name;
  botNameEl.textContent    = bot.name;

  setHpBars();
  if (!currentMap) {
    rollMap(playerAllocation, currentMatchLevelId);
  } else {
    renderMapUI();
  }
  updateLevelUI();
  buildStatStacks();
  renderCounterRow();
  updateSlotsUnknown();
  resetStatHighlights();
  centerVsEl.classList.remove('visible');

  plannedRound = {
    playerStatId: null,
    playerMult:   1,
    botStatId:    null,
    botMult:      1,
  };

  const mapLabel = currentMap ? currentMap.name : 'arenie';
  setLog(`Poziom ${currentMatchLevelId} • Pokój #${currentRoom ? currentRoom.id : '?'} • ${mapLabel} (pula x${poolMultiplier}). Najpierw losujesz swój atak.`);
  prepareNextTurn();
}

// INIT / LISTENERY

startBtn.addEventListener('click', () => {
  openBuildScreen(true);
});

buildBackBtn.addEventListener('click', () => {
  showScreen('start');
});

buildStatsList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const row = e.target.closest('.build-row');
  if (!row) return;
  const id = row.dataset.statId;

  if (btn.dataset.value !== undefined) {
    const chosenVal = Number(btn.dataset.value);
    const currentVal = playerAllocation[id];
    const totalWithout = totalAllocated() - currentVal;
    const maxForRow = STAT_POINTS_TOTAL - totalWithout;
    if (chosenVal <= maxForRow) {
      playerAllocation[id] = chosenVal;
    }
  }
  updateBuildUI();
});

buildConfirmBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  showScreen('battle');
  startBattleWithCurrentAllocation();
});

if (rerollMapBtn) {
  rerollMapBtn.addEventListener('click', () => {
    rollMap(playerAllocation, currentLevelId);
  });
}

if (demoLevelBtn) {
  demoLevelBtn.addEventListener('click', () => {
    if (screenBattle.classList.contains('active') && phase !== 'idle') return;
    const next = currentLevelId >= LEVELS.length ? 1 : currentLevelId + 1;
    setLevelForDemo(next);
  });
}

if (roomsListEl) {
  roomsListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-room-id]');
    if (!btn) return;
    const id = Number(btn.dataset.roomId);
    selectRoomById(id);
    updateBuildUI();
  });
}

if (createRoomBtn) {
  createRoomBtn.addEventListener('click', () => {
    const stakeStr = prompt('Podaj stawkę pokoju (pkt):', '30');
    if (!stakeStr) return;
    const stake = Number(stakeStr);
    if (!Number.isFinite(stake) || stake <= 0) return;

    const room = {
      id: nextRoomId++,
      level: currentLevelId,
      stake,
      ownerName: 'Ty',
    };
    rooms.push(room);
    currentRoom = room;
    renderRooms();
    updateBuildUI();
  });
}

if (rollBtn) {
  rollBtn.addEventListener('click', () => {
    if (phase === 'idle') {
      rollPlayerAttack();
    } else if (phase === 'playerRolled') {
      playTurnAfterPlayerRoll();
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (inAnimation) return;
    openBuildScreen(true);
  });
}

// DEV

if (devBonusBtn) {
  devBonusBtn.addEventListener('click', () => {
    if (!currentMap) rollMap(playerAllocation, currentLevelId);
    const approxBonus = Math.max(1, Math.round(mapBuffPercent / 5));
    showMapBonusVisual(approxBonus);
  });
}

if (devWinBtn) {
  devWinBtn.addEventListener('click', () => endBattle('player'));
}

if (devLoseBtn) {
  devLoseBtn.addEventListener('click', () => endBattle('bot'));
}

if (devDodgeBtn) {
  devDodgeBtn.addEventListener('click', () => showDodge());
}

// start
updateLevelUI();
showScreen('start');
