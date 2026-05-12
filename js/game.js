// ========================================================
// English Monopoly PWA — game.js (v3: animals + sound + editor)
// ========================================================

const BOARD = [
  {id:0,  type:'start',       emoji:'🏁', label:'START'},
  {id:1,  type:'sentence',    emoji:'📝', label:'造句'},
  {id:2,  type:'transform',   emoji:'🔄', label:'句型'},
  {id:3,  type:'translation', emoji:'🌏', label:'翻譯'},
  {id:4,  type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:5,  type:'sentence',    emoji:'📝', label:'造句'},
  {id:6,  type:'chance',      emoji:'❓', label:'機會'},
  {id:7,  type:'transform',   emoji:'🔄', label:'句型'},
  {id:8,  type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:9,  type:'translation', emoji:'🌏', label:'翻譯'},
  {id:10, type:'jail',        emoji:'🚔', label:'坐牢'},
  {id:11, type:'hospital',    emoji:'🏥', label:'醫院'},
  {id:12, type:'destiny',     emoji:'💫', label:'命運'},
  {id:13, type:'sentence',    emoji:'📝', label:'造句'},
  {id:14, type:'translation', emoji:'🌏', label:'翻譯'},
  {id:15, type:'transform',   emoji:'🔄', label:'句型'},
  {id:16, type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:17, type:'sentence',    emoji:'📝', label:'造句'},
  {id:18, type:'chance',      emoji:'❓', label:'機會'},
  {id:19, type:'transform',   emoji:'🔄', label:'句型'},
  {id:20, type:'translation', emoji:'🌏', label:'翻譯'},
  {id:21, type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:22, type:'sentence',    emoji:'📝', label:'造句'},
  {id:23, type:'destiny',     emoji:'💫', label:'命運'},
  {id:24, type:'transform',   emoji:'🔄', label:'句型'},
  {id:25, type:'translation', emoji:'🌏', label:'翻譯'},
  {id:26, type:'sentence',    emoji:'📝', label:'造句'},
  {id:27, type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:28, type:'transform',   emoji:'🔄', label:'句型'},
  {id:29, type:'translation', emoji:'🌏', label:'翻譯'},
  {id:30, type:'vocabulary',  emoji:'✏️', label:'單字'},
  {id:31, type:'sentence',    emoji:'📝', label:'造句'},
  {id:32, type:'transform',   emoji:'🔄', label:'句型'},
  {id:33, type:'translation', emoji:'🌏', label:'翻譯'},
  {id:34, type:'sentence',    emoji:'📝', label:'造句'},
  {id:35, type:'transform',   emoji:'🔄', label:'句型'},
];

const GRID_POS = {
  0:[10,1], 1:[10,2], 2:[10,3], 3:[10,4], 4:[10,5],
  5:[10,6], 6:[10,7], 7:[10,8], 8:[10,9], 9:[10,10],
  10:[9,10],11:[8,10],12:[7,10],13:[6,10],14:[5,10],
  15:[4,10],16:[3,10],17:[2,10],18:[1,10],
  19:[1,9], 20:[1,8], 21:[1,7], 22:[1,6], 23:[1,5],
  24:[1,4], 25:[1,3], 26:[1,2], 27:[1,1],
  28:[2,1], 29:[3,1], 30:[4,1], 31:[5,1], 32:[6,1],
  33:[7,1], 34:[8,1], 35:[9,1],
};

const PLAYER_COLORS  = ['#ef4444','#3b82f6','#10b981','#f59e0b','#a855f7','#ec4899'];
const PLAYER_ANIMALS = ['🐱','🐶','🐰','🐼','🦊','🐨'];
const DICE_EMOJIS    = ['⚀','⚁','⚂','⚃','⚄','⚅'];

const STORAGE_KEY = 'em-pwa-data-v1';

let G = {
  players: [],
  current: 0,
  phase: 'idle',
  questions: null,
  cards: null,
  usedQ: { sentence:[], transform:[], translation:[], vocabulary:[] },
  currentQ: null,
  currentCard: null,
  pendingEffect: null,
  timerInterval: null,
  timerLeft: 30,
};

// ========================================================
// SOUND  — Web Audio synthesized
// ========================================================
const Sound = {
  ctx: null, masterGain: null,
  bgmNodes: [], bgmTimer: null,
  enabled: true, bgmEnabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) { console.warn('AudioContext failed'); }
  },

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); },

  tone(freq, dur, type='sine', vol=0.2, startOffset=0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  },

  dice() {
    for (let i = 0; i < 10; i++) {
      this.tone(180 + Math.random() * 250, 0.05, 'square', 0.12, i * 0.06);
    }
  },

  step() { this.tone(700, 0.05, 'sine', 0.12); },

  correct() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.22, i * 0.08));
  },

  wrong() {
    this.tone(220, 0.15, 'sawtooth', 0.18, 0);
    this.tone(165, 0.35, 'sawtooth', 0.18, 0.12);
  },

  flip() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.3);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.3);
  },

  card() { [880, 1100, 1320].forEach((f, i) => this.tone(f, 0.15, 'sine', 0.18, i * 0.06)); },

  jail() {
    this.tone(330, 0.2, 'square', 0.2, 0);
    this.tone(247, 0.3, 'square', 0.2, 0.15);
  },

  win() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    melody.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.28, i * 0.13));
  },

  turn() { this.tone(660, 0.1, 'sine', 0.12); },

  // ---- Background Music: simple looping melody ----
  bgmMelody: [
    {f: 523, d: 0.25}, {f: 587, d: 0.25}, {f: 659, d: 0.5},
    {f: 587, d: 0.25}, {f: 523, d: 0.25}, {f: 440, d: 0.5},
    {f: 523, d: 0.25}, {f: 587, d: 0.25}, {f: 659, d: 0.25}, {f: 698, d: 0.25},
    {f: 784, d: 0.5},  {f: 659, d: 0.5},
  ],

  playBgm() {
    if (!this.enabled || !this.bgmEnabled || !this.ctx) return;
    this.stopBgm();
    let i = 0;
    const playNext = () => {
      if (!this.bgmEnabled || !this.enabled) return;
      const note = this.bgmMelody[i % this.bgmMelody.length];
      this.tone(note.f, note.d * 0.9, 'triangle', 0.05);
      this.tone(note.f / 2, note.d * 0.9, 'sine', 0.04);  // bass
      i++;
      this.bgmTimer = setTimeout(playNext, note.d * 1000);
    };
    playNext();
  },

  stopBgm() {
    if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null; }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopBgm();
    else this.playBgm();
    return this.enabled;
  }
};

// ========================================================
// DATA — load defaults, allow localStorage overrides
// ========================================================
async function loadData() {
  // First load defaults from server
  const [qRes, cRes] = await Promise.all([
    fetch('./data/questions.json'),
    fetch('./data/cards.json'),
  ]);
  const defaultQ = await qRes.json();
  const defaultC = await cRes.json();

  // Check for saved overrides
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      G.questions = parsed.questions || defaultQ;
      G.cards     = parsed.cards     || defaultC;
    } catch {
      G.questions = defaultQ; G.cards = defaultC;
    }
  } else {
    G.questions = defaultQ;
    G.cards     = defaultC;
  }
  G._defaults = { questions: defaultQ, cards: defaultC };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    questions: G.questions,
    cards: G.cards,
  }));
}

function resetData() {
  G.questions = JSON.parse(JSON.stringify(G._defaults.questions));
  G.cards     = JSON.parse(JSON.stringify(G._defaults.cards));
  localStorage.removeItem(STORAGE_KEY);
}

// ========================================================
// Helpers
// ========================================================

function pickQuestion(type) {
  const pool = G.questions[type] || [];
  const used = G.usedQ[type];
  let available = pool.filter(q => !used.includes(q.id));
  if (available.length === 0) { G.usedQ[type] = []; available = pool; }
  const q = available[Math.floor(Math.random() * available.length)];
  G.usedQ[type].push(q.id);
  return q;
}

function pickCard(type) {
  const pool = G.cards[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

function cp() { return G.players[G.current]; }

function addLog(msg, highlight = false) {
  const el = document.getElementById('log-entries');
  const div = document.createElement('div');
  div.className = 'log-entry' + (highlight ? ' highlight' : '');
  div.textContent = msg;
  el.prepend(div);
  while (el.children.length > 30) el.removeChild(el.lastChild);
}

function showRollResult(text) {
  const el = document.getElementById('roll-result');
  el.textContent = text;
  el.classList.remove('hidden');
}
function hideRollResult() { document.getElementById('roll-result').classList.add('hidden'); }

// ========================================================
// Setup screen
// ========================================================

function buildSetup(count) {
  const container = document.getElementById('player-inputs');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'player-input-row';
    const dot = document.createElement('div');
    dot.className = 'player-token-preview';
    dot.style.background = PLAYER_COLORS[i];
    dot.textContent = PLAYER_ANIMALS[i];
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `玩家 ${i + 1} 的名稱`;
    inp.value = `玩家 ${i + 1}`;
    inp.maxLength = 12;
    row.appendChild(dot);
    row.appendChild(inp);
    container.appendChild(row);
  }
}

// ========================================================
// Board rendering
// ========================================================

function buildBoard() {
  const grid = document.getElementById('board-grid');
  grid.innerHTML = '';

  const center = document.createElement('div');
  center.className = 'board-center';
  center.style.gridRow  = '2 / 10';
  center.style.gridColumn = '2 / 10';
  center.innerHTML = `
    <div class="board-center-title">🎲 英文大富翁</div>
    <div class="board-center-sub">繞完一圈回到起點獲勝</div>
    <div id="dice-display" class="dice-display">⚀</div>
    <div id="center-status" class="center-status">等待擲骰…</div>
  `;
  grid.appendChild(center);

  BOARD.forEach(sq => {
    const cell = document.createElement('div');
    cell.id   = `sq-${sq.id}`;
    cell.className = `board-sq sq-${sq.type}`;
    const [r, c] = GRID_POS[sq.id];
    cell.style.gridRow    = r;
    cell.style.gridColumn = c;
    cell.innerHTML = `
      <span class="sq-emoji">${sq.emoji}</span>
      <span class="sq-label">${sq.label}</span>
      <span class="sq-id">${sq.id}</span>
      <div class="sq-tokens" id="tokens-${sq.id}"></div>
    `;
    grid.appendChild(cell);
  });
}

function renderTokens() {
  document.querySelectorAll('.sq-tokens').forEach(el => (el.innerHTML = ''));
  G.players.forEach((p, i) => {
    const container = document.getElementById(`tokens-${p.position}`);
    if (!container) return;
    const tok = document.createElement('div');
    tok.className = 'token';
    tok.style.background = PLAYER_COLORS[i];
    tok.textContent = PLAYER_ANIMALS[i];
    container.appendChild(tok);
  });
}

function highlightCurrentSquare(pos) {
  document.querySelectorAll('.board-sq').forEach(el => el.classList.remove('current-sq'));
  const el = document.getElementById(`sq-${pos}`);
  if (el) el.classList.add('current-sq');
}

// ========================================================
// Player panel
// ========================================================

function renderPlayers() {
  const panel = document.getElementById('players-panel');
  panel.innerHTML = '';
  G.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card' + (i === G.current ? ' active-player' : '') + (p.skipTurn ? ' skipping' : '');
    const badges = [];
    if (p.immunityCards > 0) badges.push(`<span class="immunity-badge">🛡️×${p.immunityCards}</span>`);
    if (p.skipTurn)          badges.push(`<span class="skip-badge">💤暫停</span>`);
    card.innerHTML = `
      <div class="player-avatar" style="background:${PLAYER_COLORS[i]}">${PLAYER_ANIMALS[i]}</div>
      <div class="player-info">
        <div class="player-name">${p.name}</div>
        <div class="player-details">
          <span class="player-pos">📍 第 ${p.position} 格</span>
          <div class="player-cards">${badges.join('')}</div>
        </div>
      </div>
    `;
    panel.appendChild(card);
  });
}

function updateTurnInfo() {
  const p = cp();
  document.getElementById('turn-info').innerHTML = `
    <div class="turn-label">輪到</div>
    <div class="turn-name" style="color:${PLAYER_COLORS[G.current]}">${PLAYER_ANIMALS[G.current]} ${p.name}</div>
    <div class="turn-hint">📍 第 ${p.position} 格</div>
  `;
}

// ========================================================
// Game start
// ========================================================

async function startGame() {
  Sound.resume();
  const inputs = document.querySelectorAll('.player-input-row input');
  G.players = Array.from(inputs).map((inp, i) => ({
    name: inp.value.trim() || `玩家${i + 1}`,
    position: 0,
    skipTurn: false,
    immunityCards: 0,
    laps: 0,
    correctCount: 0,
    wrongCount: 0,
  }));
  G.current = 0;
  G.phase   = 'idle';
  G.usedQ   = { sentence:[], transform:[], translation:[], vocabulary:[] };

  document.getElementById('setup-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');

  buildBoard();
  renderTokens();
  renderPlayers();
  updateTurnInfo();
  addLog('遊戲開始！繞完一圈回到起點即獲勝 🎉', true);
  setRollEnabled(true);
  Sound.playBgm();
}

// ========================================================
// Roll dice
// ========================================================

function setRollEnabled(on) {
  document.getElementById('roll-btn').disabled = !on;
}

function rollDice() {
  if (G.phase !== 'idle') return;
  Sound.resume();
  const p = cp();

  if (p.skipTurn) {
    p.skipTurn = false;
    addLog(`${p.name} 暫停一回合，跳過！`);
    renderPlayers();
    nextTurn();
    return;
  }

  G.phase = 'rolling';
  setRollEnabled(false);
  hideRollResult();
  Sound.dice();

  const diceEl = document.getElementById('dice-display');
  diceEl.classList.add('rolling');

  let ticks = 0;
  const maxTicks = 12;
  const iv = setInterval(() => {
    diceEl.textContent = DICE_EMOJIS[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(iv);
      diceEl.classList.remove('rolling');
      const roll = Math.floor(Math.random() * 6) + 1;
      diceEl.textContent = DICE_EMOJIS[roll - 1];
      finishRoll(roll);
    }
  }, 80);
}

function finishRoll(roll) {
  const p = cp();
  showRollResult(`🎲 擲出 ${roll} 點`);
  addLog(`${p.name} 擲出 ${roll}，移動 ${roll} 格`, true);
  document.getElementById('center-status').textContent = `${p.name} 擲出 ${roll}`;
  G.phase = 'moving';
  movePlayer(G.current, roll);
}

// ========================================================
// Movement
// ========================================================

function movePlayer(playerIndex, steps) {
  const p = G.players[playerIndex];
  let newPos = p.position + steps;

  if (newPos >= 36) {
    p.laps++;
    p.position = 0;
    renderTokens(); renderPlayers(); highlightCurrentSquare(0);
    Sound.win();
    addLog(`🏆 ${p.name} 繞完一圈回到起點！`, true);
    triggerWin(playerIndex);
    return;
  }

  // Animate step by step
  animateStepwise(playerIndex, p.position, newPos, () => {
    const sq = BOARD[newPos];
    addLog(`${p.name} 移到第 ${newPos} 格（${sq.emoji}${sq.label}）`);
    G.phase = 'moved';
    setTimeout(() => triggerSquare(newPos), 350);
  });
}

function animateStepwise(playerIndex, from, to, done) {
  const p = G.players[playerIndex];
  let cur = from;
  const tick = () => {
    if (cur === to) { done(); return; }
    cur = (cur + 1) % 36;
    p.position = cur;
    renderTokens();
    highlightCurrentSquare(cur);
    Sound.step();
    setTimeout(tick, 180);
  };
  tick();
}

// ========================================================
// Square triggers
// ========================================================

function triggerSquare(pos) {
  const sq = BOARD[pos];
  const p  = cp();

  switch (sq.type) {
    case 'start':
      nextTurn();
      break;

    case 'sentence':
    case 'transform':
    case 'translation':
    case 'vocabulary':
      if (p.immunityCards > 0) {
        p.immunityCards--;
        addLog(`${p.name} 使用免答題卡！跳過此題 🛡️`);
        renderPlayers();
        nextTurn();
        return;
      }
      G.phase = 'question';
      showQuestionModal(sq.type);
      break;

    case 'chance':
      G.phase = 'card';
      showCardModal('chance');
      break;

    case 'destiny':
      G.phase = 'card';
      showCardModal('destiny');
      break;

    case 'jail':
      Sound.jail();
      showJailModal();
      break;

    case 'hospital':
      p.skipTurn = true;
      p.immunityCards++;
      Sound.jail();
      addLog(`${p.name} 住院！獲得 1 張免答題卡 🛡️，下回合暫停`);
      renderPlayers();
      nextTurn();
      break;

    default:
      nextTurn();
  }
}

// ========================================================
// Question modal
// ========================================================

function showQuestionModal(type) {
  const q = pickQuestion(type);
  if (!q) { nextTurn(); return; }
  G.currentQ = q;

  const typeNames = { sentence:'📝 造句題', transform:'🔄 句型轉換', translation:'🌏 翻譯題', vocabulary:'✏️ 單字題' };
  document.getElementById('q-type-badge').textContent = typeNames[type];

  const content = document.getElementById('q-content');
  const inputArea = document.getElementById('q-input-area');
  document.getElementById('q-answer-reveal').classList.add('hidden');
  document.getElementById('q-submit-btn').classList.remove('hidden');
  document.getElementById('q-submit-btn').textContent = '提交答案';
  document.getElementById('q-judge-btns').classList.add('hidden');

  if (type === 'sentence') {
    content.innerHTML = `
      <div class="q-label">用以下單字造一個完整的英文句子</div>
      <div class="q-word">${q.word}</div>
      <div class="q-hint">提示：${q.hint || ''}</div>
    `;
    inputArea.innerHTML = `<textarea class="answer-textarea" id="ans-input" placeholder="在此輸入你的句子…"></textarea>`;
  } else if (type === 'transform') {
    content.innerHTML = `
      <div class="q-label">句型改寫</div>
      <div class="q-original">${q.original}</div>
      <div class="q-instruction">▶ ${q.instruction}</div>
    `;
    inputArea.innerHTML = `<textarea class="answer-textarea" id="ans-input" placeholder="在此輸入改寫後的句子…"></textarea>`;
  } else if (type === 'translation') {
    const dir = q.type === 'c2e' ? '中文翻英文' : '英文翻中文';
    content.innerHTML = `
      <div class="q-label">翻譯（${dir}）</div>
      <div class="q-source">${q.source}</div>
    `;
    inputArea.innerHTML = `<textarea class="answer-textarea" id="ans-input" placeholder="在此輸入翻譯…"></textarea>`;
  } else if (type === 'vocabulary') {
    content.innerHTML = `
      <div class="q-label">單字填空 / 選擇題</div>
      <div class="q-original" style="font-size:1.05em">${q.question}</div>
    `;
    inputArea.innerHTML = `<div class="mc-options">${
      q.options.map((opt, i) =>
        `<button class="mc-option" data-idx="${i}" onclick="selectMC(this)">${'ABCD'[i]}. ${opt}</button>`
      ).join('')
    }</div>`;
  }

  document.getElementById('question-modal').classList.remove('hidden');
  startTimer(30);
}

let selectedMC = -1;
function selectMC(btn) {
  document.querySelectorAll('.mc-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMC = parseInt(btn.dataset.idx);
}

function startTimer(seconds) {
  G.timerLeft = seconds;
  const bar   = document.getElementById('timer-bar');
  const count = document.getElementById('timer-count');
  count.textContent = seconds;
  bar.style.width   = '100%';
  bar.className     = 'timer-bar';

  clearInterval(G.timerInterval);
  G.timerInterval = setInterval(() => {
    G.timerLeft--;
    count.textContent = G.timerLeft;
    const pct = (G.timerLeft / seconds) * 100;
    bar.style.width = pct + '%';
    if (G.timerLeft <= 10) bar.className = 'timer-bar danger';
    else if (G.timerLeft <= 20) bar.className = 'timer-bar warning';

    if (G.timerLeft <= 0) {
      clearInterval(G.timerInterval);
      addLog(`${cp().name} 超時！⏰`);
      handleWrong();
    }
  }, 1000);
}
function stopTimer() { clearInterval(G.timerInterval); }

function submitAnswer() {
  const q = G.currentQ;
  stopTimer();

  if (q.options) {
    const correct = selectedMC === q.answer;
    document.querySelectorAll('.mc-option').forEach((btn, i) => {
      if (i === q.answer) btn.classList.add('correct');
      else if (i === selectedMC && !correct) btn.classList.add('wrong');
    });
    document.getElementById('q-answer-reveal').classList.remove('hidden');
    document.getElementById('q-answer-text').textContent =
      `正確答案：${'ABCD'[q.answer]}. ${q.options[q.answer]} — ${q.explanation || ''}`;
    document.getElementById('q-submit-btn').classList.add('hidden');

    if (correct) Sound.correct(); else Sound.wrong();

    setTimeout(() => {
      closeQuestionModal();
      if (correct) handleCorrect(); else handleWrong();
    }, 1500);
    selectedMC = -1;
    return;
  }

  document.getElementById('q-answer-reveal').classList.remove('hidden');
  document.getElementById('q-answer-text').innerHTML = buildAnswerHTML(q);
  document.getElementById('q-submit-btn').classList.add('hidden');
  document.getElementById('q-judge-btns').classList.remove('hidden');
}

function buildAnswerHTML(q) {
  if (q.example) return `<strong>參考例句：</strong>${q.example}`;
  if (q.answer)  return `<strong>答案：</strong>${q.answer}`;
  return '';
}

function closeQuestionModal() {
  document.getElementById('question-modal').classList.add('hidden');
  stopTimer();
}

function handleCorrect() {
  closeQuestionModal();
  if (G.pendingEffect) return handleCorrectWithEffect();
  const p = cp();
  p.correctCount++;
  Sound.correct();
  addLog(`${p.name} 答對了！✅`, true);
  renderPlayers();
  updateTurnInfo();
  nextTurn();
}

function handleWrong() {
  closeQuestionModal();
  if (G.pendingEffect) return handleWrongWithEffect();
  const p = cp();
  p.wrongCount++;
  Sound.wrong();
  addLog(`${p.name} 答錯了，停留原地 ❌`);
  renderPlayers();
  updateTurnInfo();
  nextTurn();
}

// ========================================================
// Card modal
// ========================================================

function showCardModal(type) {
  const card = pickCard(type);
  G.currentCard = card;

  const modal = document.getElementById('card-modal');
  const back  = modal.querySelector('.card-back');
  const front = document.getElementById('card-front');

  back.style.display = 'flex';
  front.classList.add('hidden');
  document.getElementById('card-flip-btn').classList.remove('hidden');
  document.getElementById('card-ok-btn').classList.add('hidden');

  modal.querySelector('#card-back-icon').textContent = type === 'chance' ? '❓' : '💫';
  modal.querySelector('.card-back-text').textContent = type === 'chance' ? '機會卡' : '命運卡';

  modal.classList.remove('hidden');
  Sound.card();
}

function flipCard() {
  const card = G.currentCard;
  Sound.flip();
  document.querySelector('.card-back').style.display = 'none';
  document.getElementById('card-front').classList.remove('hidden');
  document.getElementById('card-icon').textContent  = card.icon;
  document.getElementById('card-title').textContent = card.title;
  document.getElementById('card-desc').textContent  = card.desc;
  document.getElementById('card-flip-btn').classList.add('hidden');
  document.getElementById('card-ok-btn').classList.remove('hidden');
  addLog(`${cp().name} 抽到：${card.icon} ${card.title}`, true);
}

function executeCardEffect() {
  document.getElementById('card-modal').classList.add('hidden');
  const card = G.currentCard;
  const p    = cp();

  switch (card.effect) {
    case 'advance': {
      let newPos = p.position + card.value;
      if (newPos >= 36) {
        p.laps++;
        p.position = 0;
        renderTokens(); renderPlayers(); highlightCurrentSquare(0);
        Sound.win();
        addLog(`🏆 ${p.name} 繞完一圈！`, true);
        triggerWin(G.current);
        return;
      }
      addLog(`${p.name} 前進 ${card.value} 格`);
      animateStepwise(G.current, p.position, newPos, () => {
        renderPlayers();
        setTimeout(() => triggerSquare(p.position), 350);
      });
      return;
    }

    case 'back': {
      const target = Math.max(0, p.position - card.value);
      addLog(`${p.name} 退後 ${card.value} 格`);
      // Animate stepwise backwards
      let cur = p.position;
      const tick = () => {
        if (cur === target) {
          renderPlayers();
          setTimeout(() => triggerSquare(target), 350);
          return;
        }
        cur--;
        if (cur < 0) cur = 0;
        p.position = cur;
        renderTokens(); highlightCurrentSquare(cur);
        Sound.step();
        setTimeout(tick, 180);
      };
      tick();
      return;
    }

    case 'immunity':
      p.immunityCards += card.value;
      Sound.correct();
      addLog(`${p.name} 獲得 ${card.value} 張免答題卡！🛡️`);
      renderPlayers();
      nextTurn();
      return;

    case 'swap': {
      const nextIdx = (G.current + 1) % G.players.length;
      const next    = G.players[nextIdx];
      const tmp     = p.position;
      p.position    = next.position;
      next.position = tmp;
      Sound.flip();
      addLog(`${p.name} 與 ${next.name} 交換位置！🔄`);
      renderTokens(); renderPlayers();
      nextTurn();
      return;
    }

    case 'goToJail':
      p.position = 10;
      Sound.jail();
      addLog(`${p.name} 直接進監獄！🚔`);
      renderTokens(); renderPlayers();
      highlightCurrentSquare(10);
      showJailModal();
      return;

    case 'skipOther': {
      const nextP = G.players[(G.current + 1) % G.players.length];
      nextP.skipTurn = true;
      addLog(`${p.name} 讓 ${nextP.name} 下回合暫停！😴`);
      renderPlayers();
      nextTurn();
      return;
    }

    case 'hardTranslation':
      G.phase = 'question';
      G.pendingEffect = 'hardTranslation';
      showQuestionModal('translation');
      return;

    case 'knowledgeBonus':
      G.phase = 'question';
      G.pendingEffect = { type:'knowledgeBonus', steps: card.value };
      showKnowledgeQuestion();
      return;

    default:
      nextTurn();
  }
}

function showKnowledgeQuestion() {
  const pool = G.cards.knowledgeQuestions || [];
  if (pool.length === 0) { nextTurn(); return; }
  const q = pool[Math.floor(Math.random() * pool.length)];
  G.currentQ = { source: q.q, answer: q.a };
  document.getElementById('q-type-badge').textContent = '📚 英文小知識';
  document.getElementById('q-content').innerHTML =
    `<div class="q-label">答對可前進 2 格！</div><div class="q-source">${q.q}</div>`;
  document.getElementById('q-input-area').innerHTML =
    `<textarea class="answer-textarea" id="ans-input" placeholder="輸入答案…"></textarea>`;
  document.getElementById('q-answer-reveal').classList.add('hidden');
  document.getElementById('q-submit-btn').classList.remove('hidden');
  document.getElementById('q-judge-btns').classList.add('hidden');
  document.getElementById('question-modal').classList.remove('hidden');
  startTimer(30);
}

function handleCorrectWithEffect() {
  const eff = G.pendingEffect;
  G.pendingEffect = null;
  const p = cp();
  p.correctCount++;
  Sound.correct();

  if (eff === 'hardTranslation') {
    addLog(`${p.name} 翻譯挑戰成功！前進 3 格 📖`, true);
    advancePlayer(p, 3);
  } else if (eff === 'jailBreak') {
    addLog(`${p.name} 答對困難題，立即出獄！⚡`, true);
    renderPlayers();
    nextTurn();
  } else if (eff && eff.type === 'knowledgeBonus') {
    addLog(`${p.name} 小知識答對！前進 ${eff.steps} 格 📚`, true);
    advancePlayer(p, eff.steps);
  } else {
    nextTurn();
  }
}

function handleWrongWithEffect() {
  const eff = G.pendingEffect;
  G.pendingEffect = null;
  const p = cp();
  p.wrongCount++;
  Sound.wrong();

  if (eff === 'hardTranslation') {
    addLog(`${p.name} 翻譯挑戰失敗！退後 2 格 😢`);
    const target = Math.max(0, p.position - 2);
    p.position = target;
    renderTokens(); renderPlayers(); highlightCurrentSquare(target);
    nextTurn();
  } else if (eff === 'jailBreak') {
    addLog(`${p.name} 越獄失敗，下回合暫停 💤`);
    p.skipTurn = true;
    renderPlayers();
    nextTurn();
  } else {
    addLog(`${p.name} 答錯了，停留原地 ❌`);
    nextTurn();
  }
}

function advancePlayer(p, steps) {
  let newPos = p.position + steps;
  if (newPos >= 36) {
    p.laps++;
    p.position = 0;
    renderTokens(); renderPlayers(); highlightCurrentSquare(0);
    Sound.win();
    addLog(`🏆 ${p.name} 繞完一圈！`, true);
    triggerWin(G.players.indexOf(p));
    return;
  }
  const idx = G.players.indexOf(p);
  animateStepwise(idx, p.position, newPos, () => {
    renderPlayers();
    setTimeout(() => triggerSquare(p.position), 350);
  });
}

// ========================================================
// Jail
// ========================================================

function showJailModal() {
  const p = cp();
  document.getElementById('jail-player-name').textContent = p.name;
  document.getElementById('jail-modal').classList.remove('hidden');
  G.phase = 'jail';
}

// ========================================================
// Next turn / Win
// ========================================================

function nextTurn() {
  G.phase   = 'idle';
  G.current = (G.current + 1) % G.players.length;
  hideRollResult();
  renderPlayers();
  updateTurnInfo();
  highlightCurrentSquare(cp().position);
  document.getElementById('center-status').textContent = `等待 ${cp().name} 擲骰…`;
  setRollEnabled(true);
  Sound.turn();
}

function triggerWin(playerIndex) {
  G.phase = 'ended';
  setRollEnabled(false);
  Sound.stopBgm();
  const winner = G.players[playerIndex];

  const others = G.players
    .map((p, i) => ({ ...p, colorIdx: i }))
    .filter((_, i) => i !== playerIndex)
    .sort((a, b) => b.position - a.position);

  const allRanked = [{ ...winner, colorIdx: playerIndex }, ...others];
  const medals = ['🥇','🥈','🥉','🏅','🏅','🏅'];

  const scoresHTML = allRanked.map((p, i) => `
    <div class="final-score-row ${i === 0 ? 'final-winner-row' : ''}">
      <div class="final-rank">${medals[i]}</div>
      <div class="final-name" style="color:${PLAYER_COLORS[p.colorIdx]}">${PLAYER_ANIMALS[p.colorIdx]} ${p.name}</div>
      <div class="final-pts">第 ${p.position} 格</div>
    </div>
  `).join('');

  const reportHTML = G.players.map((p, i) => `
    <div style="font-size:0.95rem;color:var(--text-muted);margin-top:0.4rem">
      ${PLAYER_ANIMALS[i]} ${p.name}：答對 ${p.correctCount} 題 / 答錯 ${p.wrongCount} 題
    </div>
  `).join('');

  document.getElementById('win-title').textContent = `${PLAYER_ANIMALS[playerIndex]} ${winner.name} 獲勝！ 🎉`;
  document.getElementById('final-scores').innerHTML = scoresHTML;
  document.getElementById('answer-report').innerHTML = reportHTML;
  document.getElementById('win-modal').classList.remove('hidden');

  addLog(`🏆 ${winner.name} 率先回到終點，遊戲結束！`, true);
}

// ========================================================
// Fullscreen
// ========================================================
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}

// ========================================================
// QUESTION EDITOR (Teacher)
// ========================================================

let currentEditorTab = 'sentence';
let editingItem = null;  // { type, id } or null for new

function openEditor() {
  document.getElementById('editor-modal').classList.remove('hidden');
  selectEditorTab('sentence');
}

function closeEditor() {
  document.getElementById('editor-modal').classList.add('hidden');
  editingItem = null;
}

function selectEditorTab(tab) {
  currentEditorTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  renderEditorList();
  renderEditorForm();
}

function renderEditorList() {
  const list = document.getElementById('editor-list');
  const items = G.questions[currentEditorTab] || [];

  list.innerHTML = items.map((q, idx) => {
    let text = '';
    if (currentEditorTab === 'sentence')
      text = `<strong>${q.word}</strong> — ${q.hint || ''}`;
    else if (currentEditorTab === 'transform')
      text = `<strong>${q.instruction}</strong><br>${q.original} → ${q.answer}`;
    else if (currentEditorTab === 'translation')
      text = `<strong>${q.type === 'c2e' ? '中→英' : '英→中'}</strong>：${q.source} → ${q.answer}`;
    else if (currentEditorTab === 'vocabulary')
      text = `${q.question}<br><strong>答：${'ABCD'[q.answer]}. ${q.options[q.answer]}</strong>`;

    return `
      <div class="editor-item">
        <div class="editor-item-text">${text}</div>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="editItem('${q.id}')">✏️</button>
          <button class="icon-btn del" onclick="deleteItem('${q.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('') || '<div style="color:var(--text-muted);text-align:center;padding:1rem">尚無題目</div>';
}

function renderEditorForm() {
  const form = document.getElementById('editor-form');
  const t = currentEditorTab;
  let html = '';
  let q = editingItem ? (G.questions[t] || []).find(x => x.id === editingItem) : {};

  if (t === 'sentence') {
    html = `
      <label>單字</label>
      <input id="f-word" value="${q.word || ''}" placeholder="例：nevertheless">
      <label>提示</label>
      <input id="f-hint" value="${q.hint || ''}" placeholder="例：用於對比兩件事">
      <label>參考例句</label>
      <textarea id="f-example" rows="2" placeholder="例：It was raining; nevertheless, we went hiking.">${q.example || ''}</textarea>
    `;
  } else if (t === 'transform') {
    html = `
      <label>原句</label>
      <input id="f-original" value="${q.original || ''}" placeholder="The teacher explained the lesson.">
      <label>改寫要求</label>
      <input id="f-instruction" value="${q.instruction || ''}" placeholder="改為被動式">
      <label>參考答案</label>
      <textarea id="f-answer" rows="2" placeholder="The lesson was explained by the teacher.">${q.answer || ''}</textarea>
    `;
  } else if (t === 'translation') {
    html = `
      <label>翻譯方向</label>
      <select id="f-type">
        <option value="c2e" ${q.type === 'c2e' ? 'selected' : ''}>中文翻英文</option>
        <option value="e2c" ${q.type === 'e2c' ? 'selected' : ''}>英文翻中文</option>
      </select>
      <label>題目（要翻譯的句子）</label>
      <textarea id="f-source" rows="2">${q.source || ''}</textarea>
      <label>參考答案</label>
      <textarea id="f-answer" rows="2">${q.answer || ''}</textarea>
    `;
  } else if (t === 'vocabulary') {
    html = `
      <label>題目</label>
      <textarea id="f-question" rows="2" placeholder="The scientist's discovery had a ______ impact.">${q.question || ''}</textarea>
      <div class="row">
        <div><label>選項 A</label><input id="f-opt0" value="${q.options?.[0] || ''}"></div>
        <div><label>選項 B</label><input id="f-opt1" value="${q.options?.[1] || ''}"></div>
      </div>
      <div class="row">
        <div><label>選項 C</label><input id="f-opt2" value="${q.options?.[2] || ''}"></div>
        <div><label>選項 D</label><input id="f-opt3" value="${q.options?.[3] || ''}"></div>
      </div>
      <label>正確答案</label>
      <select id="f-answer">
        <option value="0" ${q.answer === 0 ? 'selected' : ''}>A</option>
        <option value="1" ${q.answer === 1 ? 'selected' : ''}>B</option>
        <option value="2" ${q.answer === 2 ? 'selected' : ''}>C</option>
        <option value="3" ${q.answer === 3 ? 'selected' : ''}>D</option>
      </select>
      <label>解釋（可選）</label>
      <input id="f-explanation" value="${q.explanation || ''}">
    `;
  }

  form.innerHTML = `
    <div style="font-weight:700;margin-bottom:0.3rem">
      ${editingItem ? '✏️ 編輯題目' : '➕ 新增題目'}
    </div>
    ${html}
    <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-primary" onclick="saveItem()" style="flex:1">💾 ${editingItem ? '儲存修改' : '新增題目'}</button>
      ${editingItem ? `<button class="btn btn-ghost" onclick="cancelEdit()">取消</button>` : ''}
    </div>
  `;
}

function editItem(id) {
  editingItem = id;
  renderEditorForm();
}
function cancelEdit() { editingItem = null; renderEditorForm(); }

function saveItem() {
  const t = currentEditorTab;
  let q = {};
  if (t === 'sentence') {
    q = {
      word: document.getElementById('f-word').value.trim(),
      hint: document.getElementById('f-hint').value.trim(),
      example: document.getElementById('f-example').value.trim(),
    };
    if (!q.word) return alert('單字必填');
  } else if (t === 'transform') {
    q = {
      original: document.getElementById('f-original').value.trim(),
      instruction: document.getElementById('f-instruction').value.trim(),
      answer: document.getElementById('f-answer').value.trim(),
    };
    if (!q.original || !q.answer) return alert('原句和答案必填');
  } else if (t === 'translation') {
    q = {
      type: document.getElementById('f-type').value,
      source: document.getElementById('f-source').value.trim(),
      answer: document.getElementById('f-answer').value.trim(),
    };
    if (!q.source || !q.answer) return alert('題目和答案必填');
  } else if (t === 'vocabulary') {
    q = {
      question: document.getElementById('f-question').value.trim(),
      options: [0,1,2,3].map(i => document.getElementById('f-opt' + i).value.trim()),
      answer: parseInt(document.getElementById('f-answer').value),
      explanation: document.getElementById('f-explanation').value.trim(),
    };
    if (!q.question || q.options.some(o => !o)) return alert('題目和四個選項皆必填');
  }

  if (editingItem) {
    const arr = G.questions[t];
    const idx = arr.findIndex(x => x.id === editingItem);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...q };
  } else {
    q.id = t[0] + Date.now();
    G.questions[t].push(q);
  }
  saveData();
  editingItem = null;
  renderEditorList();
  renderEditorForm();
}

function deleteItem(id) {
  if (!confirm('確定要刪除這個題目嗎？')) return;
  G.questions[currentEditorTab] = G.questions[currentEditorTab].filter(x => x.id !== id);
  saveData();
  renderEditorList();
}

function exportData() {
  const json = JSON.stringify({ questions: G.questions, cards: G.cards }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'english-monopoly-questions.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'application/json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.questions) G.questions = parsed.questions;
      if (parsed.cards)     G.cards     = parsed.cards;
      saveData();
      renderEditorList();
      alert('匯入成功！');
    } catch (err) {
      alert('匯入失敗：' + err.message);
    }
  };
  input.click();
}

function resetToDefault() {
  if (!confirm('確定要恢復成預設題庫嗎？所有自訂題目會消失。')) return;
  resetData();
  renderEditorList();
}

// ========================================================
// Event wiring
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
  Sound.init();
  await loadData();

  let playerCount = 2;
  buildSetup(playerCount);

  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playerCount = parseInt(btn.dataset.count);
      buildSetup(playerCount);
    });
  });

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('roll-btn').addEventListener('click', rollDice);

  document.getElementById('q-submit-btn').addEventListener('click', submitAnswer);
  document.getElementById('q-correct-btn').addEventListener('click', () => {
    if (G.pendingEffect) handleCorrectWithEffect(); else handleCorrect();
  });
  document.getElementById('q-wrong-btn').addEventListener('click', () => {
    if (G.pendingEffect) handleWrongWithEffect(); else handleWrong();
  });

  document.getElementById('card-flip-btn').addEventListener('click', flipCard);
  document.getElementById('card-ok-btn').addEventListener('click', executeCardEffect);

  document.getElementById('jail-skip-btn').addEventListener('click', () => {
    document.getElementById('jail-modal').classList.add('hidden');
    const p = cp();
    p.skipTurn = true;
    addLog(`${p.name} 選擇暫停一回合 💤`);
    renderPlayers();
    nextTurn();
  });
  document.getElementById('jail-challenge-btn').addEventListener('click', () => {
    document.getElementById('jail-modal').classList.add('hidden');
    G.phase = 'question';
    G.pendingEffect = 'jailBreak';
    showQuestionModal('transform');
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('win-modal').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');
    G.pendingEffect = null;
    stopTimer();
    Sound.stopBgm();
  });

  // Fullscreen / sound
  document.getElementById('fs-btn')?.addEventListener('click', () => { Sound.resume(); toggleFullscreen(); });
  const soundBtn = document.getElementById('sound-btn');
  soundBtn?.addEventListener('click', () => {
    Sound.resume();
    const on = Sound.toggle();
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.classList.toggle('muted', !on);
  });

  // Editor
  document.getElementById('edit-q-btn')?.addEventListener('click', openEditor);
  document.getElementById('editor-close-btn')?.addEventListener('click', closeEditor);
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => selectEditorTab(b.dataset.tab));
  });
  document.getElementById('editor-add-btn')?.addEventListener('click', () => {
    editingItem = null;
    renderEditorForm();
  });
  document.getElementById('editor-export-btn')?.addEventListener('click', exportData);
  document.getElementById('editor-import-btn')?.addEventListener('click', importData);
  document.getElementById('editor-reset-btn')?.addEventListener('click', resetToDefault);
});
