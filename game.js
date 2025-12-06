// ===== KONFIG STATYSTYK =====
const STATS = [
  { id: 0, key: "str", name: "Siła",         icon: "strength.png"   },
  { id: 1, key: "vit", name: "Wytrzymałość", icon: "Durability.png" },
  { id: 2, key: "spd", name: "Szybkość",     icon: "speed.png"      },
  { id: 3, key: "tac", name: "Taktyka",      icon: "Tactics.png"    },
  { id: 4, key: "sta", name: "Kondycja",     icon: "condition.png"  },
];

// kto na kogo MOCNY
const BEATS = {
  0: [2, 4], // Siła > Szybkość, Kondycja
  1: [0, 4], // Wytrzymałość > Siła, Kondycja
  2: [1, 3], // Szybkość > Wytrzymałość, Taktyka
  3: [0, 1], // Taktyka > Siła, Wytrzymałość
  4: [2, 3], // Kondycja > Szybkość, Taktyka
};

// kto KONTRUJE daną statę (realna kara)
const COUNTERS = {
  0: [1, 3], // Siła < Wytrzymałość, Taktyka
  1: [2, 3], // Wytrzymałość < Szybkość, Taktyka
  2: [0, 4], // Szybkość < Siła, Kondycja
  3: [2, 4], // Taktyka < Szybkość, Kondycja
  4: [0, 1], // Kondycja < Siła, Wytrzymałość
};

// MAPY
const MAPS = [
  { id: "str", statIndex: 0, name: "Płonąca Arena",    baseText: "Premia do Siły (atak)",        image: "fire.png" },
  { id: "vit", statIndex: 1, name: "Leśna Forteca",    baseText: "Premia do Wytrzymałości (HP)", image: "natural.png" },
  { id: "spd", statIndex: 2, name: "Burza Prędkości",  baseText: "Premia do Szybkości",          image: "lightning.png" },
  { id: "tac", statIndex: 3, name: "Arena Taktyków",   baseText: "Premia do Taktyki",             image: "tlo.png" },
  { id: "sta", statIndex: 4, name: "Wietrzne Szczyty", baseText: "Premia do Kondycji",            image: "wind.png" },
];

const BOT_NAMES = ["Bot Kamil","Bot Antek","Bot Mira","Bot Vega","Bot Draco","Bot Astra"];

/* ===== STAN GRY ===== */
const gameState = {
  stake: 30,
  multiplier: 1,
  botName: "",
  playerStats: [0,0,0,0,0],
  botStats: [0,0,0,0,0],
  map: null,
  mapBuffPercent: 0,
  rounds: [],             // {playerStatIndex, botStatIndex, playerWeight, botWeight}
  currentRoundIndex: -1,
  preparedRoundIndex: null, // wylosowany, ale jeszcze niezaatakowany
  playerHP: 100,
  botHP: 100,
  mapSlotDone: false,
  isRoundAnimating: false,
  lastCountersPlayerUsed: [],
  lastCountersBotUsed: [],
  activePlayerStatIndex: null,  // stat użyty w tej rundzie (Ty)
  activeBotStatIndex: null,     // stat użyty w tej rundzie (Bot)
};

function $(id){ return document.getElementById(id); }
function randomFromArray(a){ return a[Math.floor(Math.random()*a.length)]; }
function randomOrderForStats(){
  const arr=[0,1,2,3,4];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function randomBuffPercent(){ return randomFromArray([5,10,15,20,25,30]); }
function randomRoundWeight(){ return 1+Math.floor(Math.random()*3); }

function setScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("screen-active"));
  const el=$(id); if(el) el.classList.add("screen-active");
}

document.addEventListener("DOMContentLoaded",()=>{
  setupStartScreen();
  setupAllocateScreen();
  setupBattleScreen();
  setupResultScreen();
  renderCountersLegend();
});

/* ========== START ========== */

function setupStartScreen(){
  $("btn-find-match").addEventListener("click",()=>{
    const stakeInput=$("stake-input");
    const stakeValue=parseInt(stakeInput.value,10);
    if(isNaN(stakeValue)||stakeValue<10){
      alert("Podaj stawkę co najmniej 10 punktów.");
      return;
    }
    gameState.stake=stakeValue;
    gameState.multiplier=1+Math.floor(Math.random()*3);
    gameState.botName=randomFromArray(BOT_NAMES);
    gameState.playerStats=[0,0,0,0,0];
    gameState.botStats=[0,0,0,0,0];
    gameState.map=null;
    gameState.mapBuffPercent=0;
    gameState.playerHP=100;
    gameState.botHP=100;
    gameState.rounds=[];
    gameState.currentRoundIndex=-1;
    gameState.preparedRoundIndex=null;
    gameState.mapSlotDone=false;
    gameState.isRoundAnimating=false;
    gameState.lastCountersPlayerUsed=[];
    gameState.lastCountersBotUsed=[];
    gameState.activePlayerStatIndex=null;
    gameState.activeBotStatIndex=null;

    renderAllocateScreen();
    setScreen("screen-allocate");
  });
}

/* ========== ROZDZIELANIE STATÓW ========== */

function setupAllocateScreen(){
  $("btn-back-start").addEventListener("click",()=>setScreen("screen-start"));
  $("btn-accept-build").addEventListener("click",()=>{
    const stats=readPlayerStatsFromForm();
    const sum=stats.reduce((s,v)=>s+v,0);
    if(sum!==10){
      alert("Musisz rozdać dokładnie 10 punktów.");
      return;
    }
    gameState.playerStats=stats;
    gameState.botStats=generateBotStats();
    initBattleState();
    setScreen("screen-battle");
    renderBattleScreenInitial();
  });
}

function renderAllocateScreen(){
  $("bot-name").textContent=gameState.botName;
  $("stake-display").textContent=gameState.stake;
  $("multiplier-display").textContent=gameState.multiplier;
  $("potential-win").textContent=gameState.stake*2*gameState.multiplier;

  const container=$("elements-form");
  container.innerHTML="";
  STATS.forEach((st,idx)=>{
    const row=document.createElement("div");
    row.className="element-row";

    const label=document.createElement("div");
    label.className="element-label";
    const img=document.createElement("img");
    img.src=st.icon;
    img.alt=st.name;
    img.className="stat-icon";
    const span=document.createElement("span");
    span.textContent=st.name;
    label.appendChild(img);
    label.appendChild(span);

    const wrap=document.createElement("div");
    wrap.className="element-input";
    const input=document.createElement("input");
    input.type="number";
    input.min="0";
    input.max="10";
    input.value="0";
    input.dataset.index=idx;
    input.addEventListener("input",updatePointsLeft);
    wrap.appendChild(input);

    row.appendChild(label);
    row.appendChild(wrap);
    container.appendChild(row);
  });

  $("points-left").textContent="10";
  startMultiplierSlotAnimation();
}

function readPlayerStatsFromForm(){
  const inputs=document.querySelectorAll("#elements-form input[type='number']");
  const stats=[0,0,0,0,0];
  inputs.forEach(input=>{
    const idx=parseInt(input.dataset.index,10);
    const val=parseInt(input.value,10)||0;
    stats[idx]=Math.max(0,val);
  });
  return stats;
}

function updatePointsLeft(){
  const stats=readPlayerStatsFromForm();
  const sum=stats.reduce((s,v)=>s+v,0);
  const left=10-sum;
  const el=$("points-left");
  el.textContent=left;
  el.style.color = left<0 ? "#fb923c" : left>0 ? "#e5e7eb" : "#22c55e";
}

function generateBotStats(){
  const s=[0,0,0,0,0];
  let p=10;
  while(p>0){
    const i=Math.floor(Math.random()*5);
    s[i]++; p--;
  }
  return s;
}

/* animacja mnożnika na starcie */

function startMultiplierSlotAnimation(){
  const multSpan=$("multiplier-display");
  const potSpan=$("potential-win");
  const stake=gameState.stake;

  let steps=15;
  let totalDelay=0;

  for(let i=0;i<steps;i++){
    const delay=40 + i*20;
    totalDelay+=delay;
    setTimeout(()=>{
      const tmp=1+Math.floor(Math.random()*3);
      multSpan.textContent=tmp;
      potSpan.textContent=stake*2*tmp;
    }, totalDelay);
  }

  setTimeout(()=>{
    multSpan.textContent=gameState.multiplier;
    potSpan.textContent=stake*2*gameState.multiplier;
  }, totalDelay+80);
}

/* ========== PRZYGOTOWANIE WALKI ========== */

function initBattleState(){
  gameState.map=randomFromArray(MAPS);
  gameState.mapBuffPercent=randomBuffPercent();

  const pOrder=randomOrderForStats();
  const bOrder=randomOrderForStats();
  gameState.rounds=[];
  for(let i=0;i<5;i++){
    gameState.rounds.push({
      playerStatIndex:pOrder[i],
      botStatIndex:bOrder[i],
      playerWeight:randomRoundWeight(),
      botWeight:randomRoundWeight(),
    });
  }
  gameState.playerHP=100;
  gameState.botHP=100;
  gameState.currentRoundIndex=-1;
  gameState.preparedRoundIndex=null;
  gameState.mapSlotDone=false;
  gameState.isRoundAnimating=false;
  gameState.lastCountersPlayerUsed=[];
  gameState.lastCountersBotUsed=[];
  gameState.activePlayerStatIndex=null;
  gameState.activeBotStatIndex=null;
}

/* ========== WALKA ========== */

function setupBattleScreen(){
  $("btn-battle-back").addEventListener("click",()=>setScreen("screen-start"));
  $("btn-next-round").addEventListener("click",()=>handleNextRoundClick());
}

function renderBattleScreenInitial(){
  $("battle-bot-name").textContent=gameState.botName;
  updateHPBars(100,100);

  $("round-header").textContent="Losowanie mapy...";
  $("round-details").textContent =
    "Najpierw losuje się mapa i premia do jednej statystyki.\n" +
    "Potem 5 ataków – losujesz atak (slot), potem klikasz „Zaatakuj”.";

  $("next-round-label").textContent="Atak 1/5 – kliknij „Losuj atak”.";
  $("btn-next-round").textContent="Losuj atak";
  $("btn-next-round").disabled=false;

  $("slot-player-icon").src="kolo_fortuny.png";
  $("slot-bot-icon").src="kolo_fortuny.png";
  $("slot-player-mult").textContent="x?";
  $("slot-bot-mult").textContent="x?";

  hideAttackMarkers();

  renderElementsLists();
  renderFighterIcons();
  renderRoundsList();
  renderMapPlaceholder();
  renderCountersSummary();
  renderCountersLegend();

  $("fighters-row").classList.remove("show");

  startMapSlotAnimation();

  $("rounds-list").innerHTML = "";
}

function renderMapPlaceholder(){
  const arena=$("battle-arena");
  arena.classList.remove("map-final-pop");
  arena.style.backgroundImage='url("tlo.png")';

  $("map-name").textContent="Losowanie mapy...";
  $("map-buff-text").textContent="Premia: ...";
  $("map-buff-icon").src="strength.png";

  $("map-multiplier").textContent =
    `Mnożnik puli: x${gameState.multiplier} • Możliwa wygrana: ${gameState.stake*2*gameState.multiplier} pkt`;
}

/* animacja losowania mapy */

function startMapSlotAnimation(){
  const arena=$("battle-arena");
  const nameEl=$("map-name");
  const buffTextEl=$("map-buff-text");
  const buffIconEl=$("map-buff-icon");

  let steps=18;
  let totalDelay=0;

  for(let i=0;i<steps;i++){
    const delay=60 + i*25;
    totalDelay+=delay;
    setTimeout(()=>{
      const tmpMap=randomFromArray(MAPS);
      const tmpStat=STATS[tmpMap.statIndex];
      const tmpPercent=randomBuffPercent();

      arena.style.backgroundImage=`url("${tmpMap.image}")`;
      nameEl.textContent=`Losowanie: ${tmpMap.name}`;
      buffTextEl.textContent=`Premia: +${tmpPercent}% do ${tmpStat.name}`;
      buffIconEl.src=tmpStat.icon;
    }, totalDelay);
  }

  const finalMap=gameState.map;
  const finalStat=STATS[finalMap.statIndex];

  setTimeout(()=>{
    arena.style.backgroundImage=`url("${finalMap.image}")`;
    nameEl.textContent=`Prawie... ${finalMap.name}`;
    buffTextEl.textContent=`Premia: +${randomBuffPercent()}% do ${finalStat.name}`;
    buffIconEl.src=finalStat.icon;
  }, totalDelay+120);

  setTimeout(()=>{
    arena.style.backgroundImage=`url("${finalMap.image}")`;
    nameEl.textContent=finalMap.name;
    buffTextEl.textContent=`Premia: +${gameState.mapBuffPercent}% do ${finalStat.name}`;
    buffIconEl.src=finalStat.icon;

    arena.classList.remove("map-final-pop");
    void arena.offsetWidth;
    arena.classList.add("map-final-pop");

    $("map-multiplier").textContent =
      `Mnożnik puli: x${gameState.multiplier} • Możliwa wygrana: ${gameState.stake*2*gameState.multiplier} pkt`;

    gameState.mapSlotDone=true;
    renderElementsLists();
    renderFighterIcons();
    renderCountersSummary();
    renderCountersLegend();

    $("fighters-row").classList.add("show");
  }, totalDelay+420);
}

function updateHPBars(pHP,bHP){
  gameState.playerHP=pHP;
  gameState.botHP=bHP;
  $("hp-player-fill").style.width=`${Math.max(0,Math.min(100,pHP))}%`;
  $("hp-bot-fill").style.width=`${Math.max(0,Math.min(100,bHP))}%`;
  $("hp-player-text").textContent=`${Math.max(0,pHP)} / 100 HP`;
  $("hp-bot-text").textContent=`${Math.max(0,bHP)} / 100 HP`;
}

/* listy statów – ukryte */

function renderElementsLists(){
  const pList=$("player-elements-list");
  const bList=$("bot-elements-list");
  if(!pList || !bList) return;
  pList.innerHTML="";
  bList.innerHTML="";

  STATS.forEach((st,idx)=>{
    const boosted = gameState.map &&
                    gameState.map.statIndex===idx &&
                    gameState.mapSlotDone;

    const liP=document.createElement("li");
    liP.textContent = boosted
      ? `${st.name}: ${gameState.playerStats[idx]} (+${gameState.mapBuffPercent}%)`
      : `${st.name}: ${gameState.playerStats[idx]}`;
    pList.appendChild(liP);

    const liB=document.createElement("li");
    liB.textContent = boosted
      ? `${st.name}: ${gameState.botStats[idx]} (+${gameState.mapBuffPercent}%)`
      : `${st.name}: ${gameState.botStats[idx]}`;
    bList.appendChild(liB);
  });
}

/* ikony za postaciami */

function renderFighterIcons(){
  const pBox=$("player-icons");
  const bBox=$("bot-icons");
  pBox.innerHTML="";
  bBox.innerHTML="";

  STATS.forEach((st,idx)=>{
    const boosted =
      gameState.map && gameState.map.statIndex===idx && gameState.mapSlotDone;

    const pRow=document.createElement("div");
    pRow.className="fighter-icon-row";
    if(boosted) pRow.classList.add("fighter-icon-boosted");
    if(gameState.lastCountersPlayerUsed.includes(idx)){
      pRow.classList.add("fighter-icon-counter-player");
    }
    if(gameState.activePlayerStatIndex === idx){
      pRow.classList.add("fighter-icon-active-player");
    }
    const pImg=document.createElement("img");
    pImg.src=st.icon; pImg.alt=st.name;
    const pText=document.createElement("div");
    pText.className="fighter-icon-text";
    const pName=document.createElement("div");
    pName.className="fighter-icon-name";
    pName.textContent=st.name;
    const pVal=document.createElement("div");
    pVal.className="fighter-icon-value";
    pVal.textContent = boosted
      ? `${gameState.playerStats[idx]} pkt (+${gameState.mapBuffPercent}%)`
      : `${gameState.playerStats[idx]} pkt`;
    pText.appendChild(pName); pText.appendChild(pVal);
    pRow.appendChild(pImg); pRow.appendChild(pText);
    pBox.appendChild(pRow);

    const bRow=document.createElement("div");
    bRow.className="fighter-icon-row";
    if(boosted) bRow.classList.add("fighter-icon-boosted");
    if(gameState.lastCountersBotUsed.includes(idx)){
      bRow.classList.add("fighter-icon-counter-bot");
    }
    if(gameState.activeBotStatIndex === idx){
      bRow.classList.add("fighter-icon-active-bot");
    }
    const bImg=document.createElement("img");
    bImg.src=st.icon; bImg.alt=st.name;
    const bText=document.createElement("div");
    bText.className="fighter-icon-text";
    const bName=document.createElement("div");
    bName.className="fighter-icon-name";
    bName.textContent=st.name;
    const bVal=document.createElement("div");
    bVal.className="fighter-icon-value";
    bVal.textContent = boosted
      ? `${gameState.botStats[idx]} pkt (+${gameState.mapBuffPercent}%)`
      : `${gameState.botStats[idx]} pkt`;
    bText.appendChild(bName); bText.appendChild(bVal);
    bRow.appendChild(bImg); bRow.appendChild(bText);
    bBox.appendChild(bRow);
  });
}

/* BAR KONTR – ile kto ma punktów w statystykach, które KONTRUJĄ daną statę */

function renderCountersSummary(){
  const wrap=$("counters-summary");
  if(!wrap) return;
  wrap.innerHTML="";

  STATS.forEach((st,idx)=>{
    const counters = COUNTERS[idx] || [];
    let me=0, bot=0;
    counters.forEach(ci=>{
      me  += gameState.playerStats[ci] || 0;
      bot += gameState.botStats[ci]   || 0;
    });

    const pill=document.createElement("div");
    pill.className="counters-summary-pill";

    if(gameState.activePlayerStatIndex === idx){
      pill.classList.add("active-player");
    }
    if(gameState.activeBotStatIndex === idx){
      pill.classList.add("active-bot");
    }

    const img=document.createElement("img");
    img.src=st.icon;
    img.alt=st.name;

    const text=document.createElement("span");
    text.innerHTML =
      `<strong>${st.name}</strong> • ` +
      `<span class="me">Ty: ${me}</span> pkt, ` +
      `<span class="bot">Bot: ${bot}</span> pkt`;

    pill.appendChild(img);
    pill.appendChild(text);
    wrap.appendChild(pill);
  });
}

/* LEGENDA KONTR */

function renderCountersLegend(){
  const wrap=$("counters-legend");
  if(!wrap) return;
  wrap.innerHTML="";

  STATS.forEach((st,idx)=>{
    const card=document.createElement("div");
    card.className="counter-card";

    if(gameState.lastCountersPlayerUsed.includes(idx)){
      card.classList.add("used-player");
    }
    if(gameState.lastCountersBotUsed.includes(idx)){
      card.classList.add("used-bot");
    }
    if(gameState.activePlayerStatIndex === idx){
      card.classList.add("active-player");
    }
    if(gameState.activeBotStatIndex === idx){
      card.classList.add("active-bot");
    }

    const header=document.createElement("div");
    header.className="counter-header";
    const img=document.createElement("img");
    img.src=st.icon; img.alt=st.name;
    const name=document.createElement("div");
    name.className="counter-name";
    name.textContent=st.name;
    header.appendChild(img); header.appendChild(name);

    const beats=BEATS[idx] || [];
    const counters=COUNTERS[idx] || [];

    const line1=document.createElement("div");
    line1.className="counter-line";
    line1.innerHTML =
      `<span class="counter-strong">Mocny na:</span> ${
        beats.length ? beats.map(i=>STATS[i].name).join(", ") : "—"
      }`;

    const line2=document.createElement("div");
    line2.className="counter-line";
    line2.innerHTML =
      `<span class="counter-weak">Słaby przeciw:</span> ${
        counters.length ? counters.map(i=>STATS[i].name).join(", ") : "—"
      }`;

    card.appendChild(header);
    card.appendChild(line1);
    card.appendChild(line2);
    wrap.appendChild(card);
  });
}

/* lista rund – log (schowany w UI, ale zostawiam) */

function renderRoundsList(){
  const c=$("rounds-list");
  if(!c) return;
  c.innerHTML="";
  if(!gameState.rounds.length){
    c.textContent="Rundy zostaną pokazane po rozpoczęciu walki.";
    return;
  }
  gameState.rounds.forEach((r,i)=>{
    const pStat=STATS[r.playerStatIndex];
    const bStat=STATS[r.botStatIndex];
    const row=document.createElement("div");
    row.className="round-row";
    const left=document.createElement("div");
    left.className="round-row-left";
    const name=document.createElement("div");
    name.className="round-row-name";
    name.textContent=`Atak ${i+1}/5`;
    const stats=document.createElement("div");
    stats.className="round-row-stats";
    stats.textContent=
      `Ty: ${pStat.name} (x${r.playerWeight}) • Bot: ${bStat.name} (x${r.botWeight})`;
    left.appendChild(name); left.appendChild(stats);
    const status=document.createElement("div");
    status.className="round-row-status";
    if(i<gameState.currentRoundIndex) status.textContent="✓ Zakończony";
    else if(i===gameState.currentRoundIndex) status.textContent="▶ Trwa";
    else status.textContent="… W kolejce";
    row.appendChild(left); row.appendChild(status);
    c.appendChild(row);
  });
}

/* ========== KLIK DÓŁ – LOSUJ / ZAATAKUJ ========== */

function handleNextRoundClick(){
  if(!gameState.mapSlotDone){
    alert("Poczekaj, aż wylosuje się mapa i premia.");
    return;
  }
  if(gameState.isRoundAnimating) return;

  const total=gameState.rounds.length;

  // jeśli runda jest przygotowana – ten klik = ZAATAKUJ
  if(gameState.preparedRoundIndex !== null){
    const idx=gameState.preparedRoundIndex;
    executeRound(idx);
    gameState.preparedRoundIndex=null;

    if(idx===total-1){
      $("btn-next-round").textContent="Pokaż wynik pojedynku";
      $("next-round-label").textContent="Pojedynek zakończony – zobacz wynik.";
    } else {
      $("btn-next-round").textContent="Losuj atak";
      $("next-round-label").textContent=`Atak ${idx+2}/5 – kliknij „Losuj atak”.`;
    }
    hideAttackMarkers();
    return;
  }

  // nie ma przygotowanej rundy -> LOSUJEMY NASTĘPNY ATAK
  const nextIndex=gameState.currentRoundIndex+1;
  if(nextIndex>=total){
    endBattleAndShowResult();
    return;
  }

  gameState.isRoundAnimating=true;
  startRoundSlotAnimation(nextIndex,()=>{
    gameState.preparedRoundIndex=nextIndex;
    gameState.isRoundAnimating=false;
    $("btn-next-round").textContent="Zaatakuj";
  });
}

/* slot na dół – emotki + mnożniki + info o mocy i kontrach */

function startRoundSlotAnimation(roundIndex,cb){
  const total=gameState.rounds.length;
  const label=$("next-round-label");
  const iconP=$("slot-player-icon");
  const iconB=$("slot-bot-icon");
  const multP=$("slot-player-mult");
  const multB=$("slot-bot-mult");

  const r=gameState.rounds[roundIndex];
  const pStatFinal=STATS[r.playerStatIndex];
  const bStatFinal=STATS[r.botStatIndex];

  let steps=18;
  let totalDelay=0;

  for(let i=0;i<steps;i++){
    const delay=60 + i*22;
    totalDelay+=delay;
    setTimeout(()=>{
      const tmpP=randomFromArray(STATS);
      const tmpB=randomFromArray(STATS);
      const tmpWp=randomRoundWeight();
      const tmpWb=randomRoundWeight();

      iconP.src=tmpP.icon;
      iconB.src=tmpB.icon;
      multP.textContent=`x${tmpWp}`;
      multB.textContent=`x${tmpWb}`;
      label.textContent=
        `Losowanie ataku ${roundIndex+1}/${total}: Ty – ${tmpP.name} (x${tmpWp}), `+
        `Bot – ${tmpB.name} (x${tmpWb})`;
    }, totalDelay);
  }

  setTimeout(()=>{
    iconP.src=pStatFinal.icon;
    iconB.src=bStatFinal.icon;
    multP.textContent=`x${randomRoundWeight()}`;
    multB.textContent=`x${randomRoundWeight()}`;
    label.textContent=
      `Prawie: Ty – ${pStatFinal.name}, Bot – ${bStatFinal.name}`;
  }, totalDelay+120);

  setTimeout(()=>{
    iconP.src=pStatFinal.icon;
    iconB.src=bStatFinal.icon;
    multP.textContent=`x${r.playerWeight}`;
    multB.textContent=`x${r.botWeight}`;

    const prevPlayerAtt = computeAttackForStat(gameState.playerStats, gameState.botStats, r.playerStatIndex);
    const prevBotAtt    = computeAttackForStat(gameState.botStats,   gameState.playerStats, r.botStatIndex);
    const playerPredDmg = Math.max(0, Math.round(prevPlayerAtt.attackAfterCounters * r.playerWeight));
    const botPredDmg    = Math.max(0, Math.round(prevBotAtt.attackAfterCounters * r.botWeight));

    label.textContent =
      `Atak ${roundIndex+1}/${total}: Ty – ${pStatFinal.name} (x${r.playerWeight}, ~${playerPredDmg} dmg, ` +
      `kontry wroga: ${prevPlayerAtt.countersPoints} pkt), ` +
      `Bot – ${bStatFinal.name} (x${r.botWeight}, ~${botPredDmg} dmg, ` +
      `Twoje kontry: ${prevBotAtt.countersPoints} pkt).`;

    // ustaw aktywne staty (do podświetleń)
    gameState.activePlayerStatIndex = r.playerStatIndex;
    gameState.activeBotStatIndex    = r.botStatIndex;
    renderCountersSummary();
    renderCountersLegend();
    renderFighterIcons();

    // markery "atak"
    const txtP=$("attack-marker-player-text");
    const txtB=$("attack-marker-bot-text");
    txtP.textContent =
      `ATAK • ${pStatFinal.name} x${r.playerWeight}\n`+
      `Moc ~${playerPredDmg} | kontry wroga: ${prevPlayerAtt.countersPoints} pkt`;
    txtB.textContent =
      `ATAK • ${bStatFinal.name} x${r.botWeight}\n`+
      `Moc ~${botPredDmg} | Twoje kontry: ${prevBotAtt.countersPoints} pkt`;
    $("attack-marker-player").classList.add("show");
    $("attack-marker-bot").classList.add("show");

    cb();
  }, totalDelay+380);
}

function hideAttackMarkers(){
  $("attack-marker-player").classList.remove("show");
  $("attack-marker-bot").classList.remove("show");
}

/* LICZENIE OBRAŻEŃ */

function computeAttackForStat(attackerStats,defenderStats,statIndex){
  const basePoints=attackerStats[statIndex];
  const attackBase=basePoints*10;

  let attackAfterBuff=attackBase;
  let buffApplied=false;
  if(gameState.map && gameState.map.statIndex===statIndex && gameState.mapSlotDone){
    attackAfterBuff=Math.round(attackBase*(1+gameState.mapBuffPercent/100));
    buffApplied=true;
  }

  const counterIndices=COUNTERS[statIndex]||[];
  const breakdown=[];
  let countersPoints=0;
  counterIndices.forEach(idx=>{
    const pts=defenderStats[idx];
    breakdown.push({idx,points:pts});
    countersPoints+=pts;
  });

  // KONTRY trochę słabsze – 75% dawnego efektu
  const penalty = Math.round(countersPoints * 10 * 0.75);

  let attackAfterCounters=attackAfterBuff-penalty;
  if(attackAfterCounters<0) attackAfterCounters=0;

  return {
    basePoints,
    attackBase,
    attackAfterBuff,
    buffApplied,
    countersPoints,
    penalty,
    attackAfterCounters,
    countersBreakdown:breakdown,
  };
}

/* wykonanie rundy po kliknięciu "Zaatakuj" */

function executeRound(roundIndex){
  const r=gameState.rounds[roundIndex];
  const pIdx=r.playerStatIndex;
  const bIdx=r.botStatIndex;
  const wp=r.playerWeight;
  const wb=r.botWeight;

  const pStat=STATS[pIdx];
  const bStat=STATS[bIdx];

  const pAtt=computeAttackForStat(gameState.playerStats,gameState.botStats,pIdx);
  const bAtt=computeAttackForStat(gameState.botStats,gameState.playerStats,bIdx);

  const pDamagePlanned = pAtt.attackAfterBuff * wp;
  const bDamagePlanned = bAtt.attackAfterBuff * wb;

  const pDmg=Math.max(0,Math.round(pAtt.attackAfterCounters*wp));
  const bDmg=Math.max(0,Math.round(bAtt.attackAfterCounters*wb));

  const newPHP=Math.max(0,gameState.playerHP-bDmg);
  const newBHP=Math.max(0,gameState.botHP-pDmg);

  // zapamiętaj użyte kontry
  gameState.lastCountersBotUsed =
    pAtt.countersBreakdown.filter(c=>c.points>0).map(c=>c.idx);
  gameState.lastCountersPlayerUsed =
    bAtt.countersBreakdown.filter(c=>c.points>0).map(c=>c.idx);

  gameState.currentRoundIndex=roundIndex;
  updateHPBars(newPHP,newBHP);
  renderElementsLists();
  renderFighterIcons();
  renderRoundsList();
  renderCountersLegend();
  renderCountersSummary();

  $("map-multiplier").textContent =
    `Runda ${roundIndex+1}/5 • Ty: ${pStat.name} (x${wp}) • Bot: ${bStat.name} (x${wb})`;

  const pFormula=`Plan: ${pDamagePlanned} • tarcza: −${pDamagePlanned-pDmg}`;
  const bFormula=`Plan: ${bDamagePlanned} • tarcza: −${bDamagePlanned-bDmg}`;

  showDamagePopup("bot",pDmg,pFormula);
  showDamagePopup("player",bDmg,bFormula);
  showShieldPopup("bot",pAtt);
  showShieldPopup("player",bAtt);

  const maxPlayerStat = Math.max(...gameState.playerStats);
  const isPowerHit = gameState.playerStats[pIdx] === maxPlayerStat && maxPlayerStat>0;

  hitAnimation("player-panel", isPowerHit);
  hitAnimation("bot-panel", false);

  if(isPowerHit){
    const ring = document.querySelector(".slot-icon-ring");
    if(ring){
      ring.classList.remove("power-hit");
      void ring.offsetWidth;
      ring.classList.add("power-hit");
    }
    const arena=$("battle-arena");
    if(arena){
      arena.classList.remove("hit-shake-strong");
      void arena.offsetWidth;
      arena.classList.add("hit-shake-strong");
    }
  }

  let t="";
  t+=`Ty – ${pStat.name}\n`;
  t+=`• Bazowo: ${pAtt.basePoints} pkt → ${pAtt.attackBase} mocy\n`;
  t+=pAtt.buffApplied
      ? `• Premia mapy: +${gameState.mapBuffPercent}% → ${pAtt.attackAfterBuff} mocy\n`
      : `• Premia mapy: brak → ${pAtt.attackAfterBuff} mocy\n`;
  t+=`• Kontry przeciwnika: ${
    pAtt.countersBreakdown.filter(c=>c.points>0)
       .map(c=>`${STATS[c.idx].name}(${c.points})`).join(", ") || "brak"
  } → −${pAtt.penalty} mocy\n`;
  t+=`• Planowany dmg: ${pDamagePlanned}, po tarczy: ${pDmg}\n\n`;

  t+=`Bot – ${bStat.name}\n`;
  t+=`• Bazowo: ${bAtt.basePoints} pkt → ${bAtt.attackBase} mocy\n`;
  t+=bAtt.buffApplied
      ? `• Premia mapy: +${gameState.mapBuffPercent}% → ${bAtt.attackAfterBuff} mocy\n`
      : `• Premia mapy: brak → ${bAtt.attackAfterBuff} mocy\n`;
  t+=`• Twoje kontry: ${
    bAtt.countersBreakdown.filter(c=>c.points>0)
       .map(c=>`${STATS[c.idx].name}(${c.points})`).join(", ") || "brak"
  } → −${bAtt.penalty} mocy\n`;
  t+=`• Planowany dmg: ${bDamagePlanned}, po tarczy: ${bDmg}\n\n`;
  t+=`HP po rundzie: Ty ${newPHP} / 100, Bot ${newBHP} / 100`;

  $("round-details").textContent=t;
}

/* dymki dmg */

function showDamagePopup(target,amount,infoText){
  const el=target==="player" ? $("damage-player") : $("damage-bot");
  if(!el) return;

  if(amount<=0){
    el.textContent=`0 dmg\nTarcza zgasiła atak.`;
  } else {
    el.textContent=`-${amount} HP\n${infoText}`;
  }

  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
}

/* tarcza – pokazuje, które kontry zadziałały i ile zabrały */

function showShieldPopup(target,attInfo){
  const el=target==="player" ? $("shield-player") : $("shield-bot");
  if(!el) return;

  const breakdown=attInfo.countersBreakdown.filter(c=>c.points>0);
  if(!breakdown.length || attInfo.penalty<=0){
    el.classList.remove("show");
    return;
  }

  let text="Tarcza (kontry):\n";
  breakdown.forEach(c=>{
    text += `${STATS[c.idx].name}: ${c.points} pkt\n`;
  });
  text += `Zabrane mocy: ${attInfo.penalty}`;

  el.textContent=text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
}

/* shake dla paneli */

function hitAnimation(panelId,isStrong){
  const panel=$(panelId);
  if(!panel) return;
  panel.classList.remove("hit-shake");
  panel.classList.remove("hit-shake-strong");
  void panel.offsetWidth;
  panel.classList.add(isStrong ? "hit-shake-strong" : "hit-shake");
}

/* KONIEC WALKI */

function endBattleAndShowResult(){
  const pHP=gameState.playerHP;
  const bHP=gameState.botHP;
  let winner;
  if(pHP>bHP) winner="player";
  else if(bHP>pHP) winner="bot";
  else winner="draw";

  const basePool=gameState.stake*2;
  const finalPool=basePool*gameState.multiplier;

  let title,summary;
  if(winner==="player"){
    title="Wygrana!";
    summary=`Pokonałeś bota ${gameState.botName} i zgarnąłeś ${finalPool} punktów.`;
  } else if(winner==="bot"){
    title="Porażka";
    summary=`Bot ${gameState.botName} wygrał ten pojedynek.`;
  } else {
    title="Remis";
    summary="Obaj skończyliście z tym samym poziomem HP.";
  }

  let detail="";
  detail+=`Twoje HP: ${pHP} / 100\n`;
  detail+=`HP przeciwnika: ${bHP} / 100\n`;
  detail+=`Stawka: ${gameState.stake} + ${gameState.stake} = ${basePool} pkt.\n`;
  detail+=`Mnożnik puli: x${gameState.multiplier} → potencjalna wygrana: ${finalPool} pkt.\n`;
  detail+=`\nTo demo logiki – w pełnej wersji te punkty mogą ładować level, ranking itd.`;

  $("result-title").textContent=title;
  $("result-summary").textContent=summary;
  $("result-detail").textContent=detail;
  setScreen("screen-result");
}

/* WYNIK */

function setupResultScreen(){
  $("btn-play-again").addEventListener("click",()=>setScreen("screen-start"));
}