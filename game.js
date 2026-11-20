(() => {
  'use strict';

  const GRID = 20;
  const CELL = 24;
  const SIZE = GRID * CELL;
  const BEST_KEY = 'gluttonous-snake-best';
  const HISTORY_KEY = 'gluttonous-snake-history';
  const PROGRESS_KEY = 'gluttonous-snake-progress';
  const MAX_HISTORY = 10;
const GRACE_MS = 400;
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const CLASSIC_THEME = {
    board: '#0d1420',
    checker: 'rgba(255,255,255,0.014)',
    grid: 'rgba(255,255,255,0.04)',
    head: '#86efac',
    tail: '#166534',
    obstacle: '#334155',
    emoji: ''
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const boardWrap = document.getElementById('boardWrap');
  const hudLabel1 = document.getElementById('hudLabel1');
  const hudLabel2 = document.getElementById('hudLabel2');
  const hudLabel3 = document.getElementById('hudLabel3');
  const hudValue1 = document.getElementById('hudValue1');
  const hudValue2 = document.getElementById('hudValue2');
  const hudValue3 = document.getElementById('hudValue3');
  const menuScreen = document.getElementById('menuScreen');
  const levelScreen = document.getElementById('levelScreen');
  const gameScreen = document.getElementById('gameScreen');
  const menuStats = document.getElementById('menuStats');
  const levelTotal = document.getElementById('levelTotal');
  const levelGrid = document.getElementById('levelGrid');
  const gameFoot = document.getElementById('gameFoot');
  const introOverlay = document.getElementById('introOverlay');
  const introTitle = document.getElementById('introTitle');
  const introIcon = document.getElementById('introIcon');
  const introDesc = document.getElementById('introDesc');
  const introMeta = document.getElementById('introMeta');
  const introTip = document.getElementById('introTip');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const overOverlay = document.getElementById('overOverlay');
  const overTitle = document.getElementById('overTitle');
  const overDesc = document.getElementById('overDesc');
  const overTip = document.getElementById('overTip');
  const overPrimaryBtn = document.getElementById('overPrimaryBtn');
  const overSecondaryBtn = document.getElementById('overSecondaryBtn');
  const completeOverlay = document.getElementById('completeOverlay');
  const starEls = [document.getElementById('star1'), document.getElementById('star2'), document.getElementById('star3')];
  const completeDesc = document.getElementById('completeDesc');
  const completeReward = document.getElementById('completeReward');
  const nextLevelBtn = document.getElementById('nextLevelBtn');
  const historyBtn = document.getElementById('historyBtn');
  const historyOverlay = document.getElementById('historyOverlay');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const historySummary = document.getElementById('historySummary');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const soundBtn = document.getElementById('soundBtn');

  const toast = document.createElement('div');
  toast.className = 'toast hidden';
  boardWrap.appendChild(toast);

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  ctx.scale(dpr, dpr);

  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (err) {}

  let progress = { unlocked: 1, levels: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (raw && typeof raw.unlocked === 'number' && raw.levels) progress = raw;
  } catch (err) {}

  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (err) {}
  if (!Array.isArray(history)) history = [];

  let soundOn = true;
  let audioCtx = null;

  function tone(freq, dur, type, vol, delay) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime + (delay || 0);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (err) {}
  }

  function soundStart() {
    tone(440, 0.08, 'triangle', 0.05, 0);
    tone(660, 0.1, 'triangle', 0.05, 0.07);
  }

  function soundEat() {
    tone(660, 0.06, 'square', 0.035, 0);
    tone(920, 0.08, 'square', 0.035, 0.05);
  }

  function soundDie() {
    tone(220, 0.15, 'sawtooth', 0.05, 0);
    tone(160, 0.2, 'sawtooth', 0.05, 0.12);
    tone(100, 0.35, 'sawtooth', 0.05, 0.24);
  }

  function soundWin() {
    tone(523, 0.1, 'triangle', 0.06, 0);
    tone(659, 0.1, 'triangle', 0.06, 0.09);
    tone(784, 0.12, 'triangle', 0.06, 0.18);
    tone(1047, 0.2, 'triangle', 0.06, 0.27);
  }

  function soundWarn() {
    tone(880, 0.07, 'square', 0.04, 0);
    tone(880, 0.07, 'square', 0.04, 0.12);
  }

  function isSafeDir(d) {
    const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };
    if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || grid[head.y][head.x]) return false;
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    return !body.some(s => s.x === head.x && s.y === head.y);
  }

  function startGrace() {
    if (danger) return;
    danger = true;
    graceUntil = performance.now() + GRACE_MS;
    boardWrap.classList.add('danger');
    soundWarn();
  }

  function endGrace() {
    danger = false;
    acc = 0;
    boardWrap.classList.remove('danger');
  }

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (err) {}
  }

  function totalStars() {
    return Object.values(progress.levels).reduce((sum, r) => sum + (r.stars || 0), 0);
  }

  function showScreen(name) {
    menuScreen.classList.toggle('hidden', name !== 'menu');
    levelScreen.classList.toggle('hidden', name !== 'levels');
    gameScreen.classList.toggle('hidden', name !== 'game');
    if (name === 'menu') {
      state = 'menu';
      menuStats.textContent = '⭐ ' + totalStars() + '/36 · 已解锁 ' + progress.unlocked + '/12 关';
    } else if (name === 'levels') {
      state = 'levels';
      renderLevelGrid();
    }
  }

  function renderLevelGrid() {
    levelGrid.innerHTML = '';
    for (const lv of LEVELS) {
      const locked = lv.id > progress.unlocked;
      const rec = progress.levels[lv.id];
      const card = document.createElement('button');
      card.className = 'level-card';
      card.disabled = locked;
      const stars = rec ? rec.stars : 0;
      card.innerHTML =
        '<span class="level-num">' + lv.id + '</span>' +
        '<span class="level-icon">' + (locked ? '🔒' : lv.icon) + '</span>' +
        '<span class="level-name">' + lv.name + '</span>' +
        '<span class="level-stars">' + (locked ? '' : '★'.repeat(stars) + '☆'.repeat(3 - stars)) + '</span>' +
        '<span class="level-best">' + (locked ? '未解锁' : rec ? '最佳 ' + rec.best + ' 分' : '未挑战') + '</span>';
      card.addEventListener('click', () => openLevel(lv.id));
      levelGrid.appendChild(card);
    }
    levelTotal.textContent = '⭐ ' + totalStars() + '/36';
  }

  function pickObstacleShape(style) {
    const x = 1 + Math.floor(Math.random() * (GRID - 2));
    const y = 1 + Math.floor(Math.random() * (GRID - 2));
    const kind = style === 'mixed'
      ? ['scatter', 'cluster', 'line'][Math.floor(Math.random() * 3)]
      : style;
    if (kind === 'cluster') {
      return [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
    }
    if (kind === 'line') {
      const len = 2 + Math.floor(Math.random() * 3);
      const horiz = Math.random() < 0.5;
      const cells = [];
      for (let i = 0; i < len; i++) {
        cells.push(horiz ? { x: x + i, y } : { x, y: y + i });
      }
      return cells;
    }
    return [{ x, y }];
  }

  function generateLevelGrid(lv) {
    const cfg = lv.gen || { count: 12, style: 'scatter', sym: false };
    const start = { x: 9, y: 10 };
    const inside = (x, y) => x >= 1 && y >= 1 && x <= GRID - 2 && y <= GRID - 2;
    const inStartZone = (x, y) => x >= 7 && x <= 12 && y >= 8 && y <= 12;
    const base = [];
    for (let y = 0; y < GRID; y++) {
      const row = [];
      for (let x = 0; x < GRID; x++) {
        row.push(x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1);
      }
      base.push(row);
    }
    let best = null;
    for (let attempt = 0; attempt < 500; attempt++) {
      const solid = base.map(row => row.slice());
      let count = 0;
      let guard = 0;
      while (count < cfg.count && guard++ < 2000) {
        const shape = pickObstacleShape(cfg.style);
        const ok = shape.every(c => inside(c.x, c.y) && !inStartZone(c.x, c.y) && !solid[c.y][c.x]);
        if (!ok) continue;
        for (const c of shape) {
          solid[c.y][c.x] = true;
          count++;
        }
        if (cfg.sym) {
          for (const c of shape) {
            const m = { x: GRID - 1 - c.x, y: c.y };
            if (!solid[m.y][m.x]) {
              solid[m.y][m.x] = true;
              count++;
            }
          }
        }
      }
      let freeTotal = 0;
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (!solid[y][x]) freeTotal++;
        }
      }
      const seen = [];
      for (let y = 0; y < GRID; y++) seen.push(new Array(GRID).fill(false));
      let reach = 0;
      const queue = [start];
      seen[start.y][start.x] = true;
      while (queue.length) {
        const c = queue.pop();
        reach++;
        for (const key of ['up', 'down', 'left', 'right']) {
          const d = DIRS[key];
          const nx = c.x + d.x;
          const ny = c.y + d.y;
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || seen[ny][nx] || solid[ny][nx]) continue;
          seen[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
      if (!best || reach > best.reach) best = { solid, seen, reach, freeTotal };
      if (reach === freeTotal) break;
    }
    const obstacles = [];
    const spawnCells = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (best.solid[y][x]) {
          obstacles.push({ x, y, edge: x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1 });
        } else if (best.seen[y][x]) {
          spawnCells.push({ x, y });
        }
      }
    }
    return { grid: best.solid, obstacles, startPos: start, spawnCells };
  }

  let mode = 'classic';
  let level = null;
  let levelData = null;
  let lives = 3;
  let state = 'menu';
  let snake = [];
  let prevSnake = [];
  let dir = { x: 1, y: 0 };
  let dirQueue = [];
  let food = { x: 15, y: 10 };
  let score = 0;
  let foodCount = 0;
  let classicLevel = 1;
  let interval = 160;
  let acc = 0;
  let lastFrame = performance.now();
  let particles = [];
  let floaters = [];
  let startTime = 0;
  let historyPause = false;
  let clearArmed = false;
  let clearTimer = null;
  let theme = CLASSIC_THEME;
  let obstacleCells = [];
  let grid = null;
  let danger = false;
  let graceUntil = 0;
  let pauseStart = 0;

  function levelLives(lv) {
    const rec = progress.levels[lv.id];
    const stars = rec ? rec.stars : 0;
    return 3 + Math.max(0, stars - 1);
  }

  function openLevel(id) {
    level = LEVELS.find(l => l.id === id);
    mode = 'adventure';
    theme = level.theme;
    headRgb = hexToRgb(theme.head);
    tailRgb = hexToRgb(theme.tail);
    levelData = generateLevelGrid(level);
    obstacleCells = levelData.obstacles;
    grid = levelData.grid;
    lives = levelLives(level);
    showScreen('game');
    setAdventureHud();
    resetLevelRun();
    state = 'intro';
    const rec = progress.levels[level.id];
    introTitle.textContent = '第 ' + level.id + ' 关 · ' + level.name;
    introIcon.textContent = level.icon;
    introDesc.textContent = '目标：吃到 ' + level.target + ' 个 ' + level.food;
    introMeta.textContent = '命数 ❤×' + lives + ' · 最佳 ' + (rec ? rec.best : 0) + ' 分';
    introTip.textContent = '每吃 5 个食物提速一档 · 撞障碍 / 边界 / 自己会失去 1 条命';
    introOverlay.classList.remove('hidden');
    overOverlay.classList.add('hidden');
    completeOverlay.classList.add('hidden');
    gameFoot.textContent = '第 ' + level.id + ' 关 · ' + level.name + ' · 历史星级越高命数越多';
    render(performance.now(), 1);
  }

  function pickStartDir(gridArr, start) {
    const options = [];
    for (const key of ['up', 'down', 'left', 'right']) {
      const d = DIRS[key];
      let ok = true;
      for (let i = -2; i <= 1; i++) {
        const x = start.x + d.x * i;
        const y = start.y + d.y * i;
        if (x < 0 || y < 0 || x >= GRID || y >= GRID || gridArr[y][x]) {
          ok = false;
          break;
        }
      }
      if (ok) options.push(d);
    }
    if (!options.length) return DIRS.right;
    return options[Math.floor(Math.random() * options.length)];
  }

  function resetLevelRun() {
    const s = levelData.startPos;
    danger = false;
    boardWrap.classList.remove('danger');
    const d = pickStartDir(grid, s);
    snake = [{ x: s.x, y: s.y }, { x: s.x - d.x, y: s.y - d.y }, { x: s.x - d.x * 2, y: s.y - d.y * 2 }];
    prevSnake = snake.map(p => ({ x: p.x, y: p.y }));
    dir = d;
    dirQueue = [];
    score = 0;
    foodCount = 0;
    interval = level.startInterval;
    acc = 0;
    particles = [];
    floaters = [];
    placeFood();
    updateHud();
  }

  function startLevelRun() {
    introOverlay.classList.add('hidden');
    resetLevelRun();
    state = 'playing';
    startTime = performance.now();
    soundStart();
  }

  function buildClassicGrid() {
    const grid = [];
    const obstacles = [];
    for (let y = 0; y < GRID; y++) {
      const row = [];
      for (let x = 0; x < GRID; x++) {
        const solid = x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1;
        row.push(solid);
        if (solid) obstacles.push({ x, y, edge: true });
      }
      grid.push(row);
    }
    return { grid, obstacles };
  }

  function setClassicHud() {
    hudLabel1.textContent = '得分';
    hudLabel2.textContent = '最高分';
    hudLabel3.textContent = '速度';
    hudValue2.textContent = best;
  }

  function setAdventureHud() {
    hudLabel1.textContent = '进度';
    hudLabel2.textContent = '得分';
    hudLabel3.textContent = '生命';
  }

  function updateHud() {
    if (mode === 'adventure') {
      hudValue1.textContent = foodCount + '/' + level.target;
      hudValue2.textContent = score;
      hudValue3.textContent = '❤️'.repeat(lives);
    } else {
      hudValue1.textContent = score;
      hudValue2.textContent = best;
      hudValue3.textContent = classicLevel;
    }
  }

  function placeFood() {
    const free = [];
    const pool = levelData && levelData.spawnCells;
    if (pool) {
      for (const p of pool) {
        if (snake.some(s => s.x === p.x && s.y === p.y)) continue;
        free.push(p);
      }
    } else {
      for (let x = 0; x < GRID; x++) {
        for (let y = 0; y < GRID; y++) {
          if (grid[y][x]) continue;
          if (snake.some(s => s.x === x && s.y === y)) continue;
          free.push({ x, y });
        }
      }
    }
    if (!free.length) return;
    food = free[Math.floor(Math.random() * free.length)];
  }

  function spawnParticles(cell) {
    const cx = cell.x * CELL + CELL / 2;
    const cy = cell.y * CELL + CELL / 2;
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2.5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        life: 1,
        color: Math.random() < 0.5 ? '#7cfc98' : '#ffd166'
      });
    }
  }

  function updateFx(dt) {
    const f = dt / 16.7;
    for (const p of particles) {
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.life -= dt / 650;
    }
    particles = particles.filter(p => p.life > 0);
    for (const t of floaters) {
      t.y -= dt / 40;
      t.life -= dt / 900;
    }
    floaters = floaters.filter(t => t.life > 0);
  }

  let toastTimer = null;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 1200);
  }

  function step() {
    prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
    while (dirQueue.length) {
      const next = dirQueue.shift();
      if (next.x !== -dir.x || next.y !== -dir.y) {
        dir = next;
        break;
      }
    }
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || grid[head.y][head.x];
    const hitSelf = body.some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
      startGrace();
      return;
    }
    snake.unshift(head);
    if (eating) {
      score += 10;
      foodCount += 1;
      if (mode === 'classic') {
        classicLevel = Math.min(10, 1 + Math.floor(foodCount / 5));
        interval = Math.max(70, 160 - (classicLevel - 1) * 10);
      } else {
        interval = Math.max(level.minInterval, level.startInterval - Math.floor(foodCount / 5) * level.step);
      }
      spawnParticles(head);
      floaters.push({ x: head.x, y: head.y, text: '+10', life: 1 });
      if (mode === 'classic' && score > best) {
        best = score;
        try { localStorage.setItem(BEST_KEY, String(best)); } catch (err) {}
      }
      placeFood();
      updateHud();
      soundEat();
      if (mode === 'adventure' && foodCount >= level.target) {
        completeLevel();
        return;
      }
    } else {
      snake.pop();
    }
  }

  function die() {
    soundDie();
    danger = false;
    boardWrap.classList.remove('danger');
    boardWrap.classList.remove('shake');
    void boardWrap.offsetWidth;
    boardWrap.classList.add('shake');
    setTimeout(() => boardWrap.classList.remove('shake'), 500);
    if (mode === 'classic') {
      gameOverClassic();
      return;
    }
    lives -= 1;
    updateHud();
    if (lives > 0) {
      state = 'dying';
      showToast('💔 失去 1 条命，还剩 ' + lives + ' 条');
      setTimeout(() => {
        if (state !== 'dying') return;
        resetLevelRun();
        state = 'playing';
      }, 1000);
    } else {
      failLevel();
    }
  }

  function failLevel() {
    state = 'over';
    overTitle.textContent = '挑战失败';
    overDesc.textContent = '本关进度 ' + foodCount + '/' + level.target + ' · 得分 ' + score;
    overTip.textContent = '3 条命已用完，从本关重新挑战吧';
    overPrimaryBtn.textContent = '重新挑战';
    overSecondaryBtn.textContent = '返回选关';
    overOverlay.classList.remove('hidden');
  }

  function gameOverClassic() {
    state = 'over';
    const secs = Math.round((performance.now() - startTime) / 1000);
    history.unshift({ m: '经典', s: score, f: foodCount, d: secs, t: Date.now() });
    history = history.slice(0, MAX_HISTORY);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (err) {}
    overTitle.textContent = '游戏结束';
    overDesc.innerHTML = '本局得分 <b>' + score + '</b> · 最高分 <b>' + best + '</b>';
    overTip.textContent = '';
    overPrimaryBtn.textContent = '再来一局';
    overSecondaryBtn.textContent = '返回菜单';
    overOverlay.classList.remove('hidden');
  }

  function completeLevel() {
    state = 'complete';
    const secs = Math.round((performance.now() - startTime) / 1000);
    const stars = secs <= level.starTimes[1] ? 3 : secs <= level.starTimes[0] ? 2 : 1;
    const rec = progress.levels[level.id] || { stars: 0, best: 0 };
    rec.stars = Math.max(rec.stars, stars);
    rec.best = Math.max(rec.best, score);
    progress.levels[level.id] = rec;
    progress.unlocked = Math.max(progress.unlocked, Math.min(12, level.id + 1));
    saveProgress();
    history.unshift({ m: '第' + level.id + '关', s: score, f: foodCount, d: secs, t: Date.now() });
    history = history.slice(0, MAX_HISTORY);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (err) {}
    soundWin();
    completeDesc.textContent = '得分 ' + score + ' · 用时 ' + secs + ' 秒 · 剩余命数 ' + lives;
    completeReward.textContent = '获得 ' + '★'.repeat(stars) + ' · 下次挑战 ' + (3 + stars - 1) + ' 条命（★=3 / ★★=4 / ★★★=5）';
    nextLevelBtn.textContent = level.id < 12 ? '下一关' : '回到选关';
    starEls.forEach(el => el.classList.remove('on'));
    completeOverlay.classList.remove('hidden');
    starEls.forEach((el, i) => {
      if (i < stars) setTimeout(() => el.classList.add('on'), 300 + i * 250);
    });
    updateHud();
  }

  function resetClassic() {
    const data = buildClassicGrid();
    danger = false;
    boardWrap.classList.remove('danger');
    grid = data.grid;
    obstacleCells = data.obstacles;
    const d = pickStartDir(grid, { x: 9, y: 10 });
    snake = [{ x: 9, y: 10 }, { x: 9 - d.x, y: 10 - d.y }, { x: 9 - d.x * 2, y: 10 - d.y * 2 }];
    prevSnake = snake.map(p => ({ x: p.x, y: p.y }));
    dir = d;
    dirQueue = [];
    score = 0;
    foodCount = 0;
    classicLevel = 1;
    interval = 160;
    acc = 0;
    particles = [];
    floaters = [];
    placeFood();
    updateHud();
  }

  function startClassic() {
    mode = 'classic';
    level = null;
    theme = CLASSIC_THEME;
    headRgb = hexToRgb(theme.head);
    tailRgb = hexToRgb(theme.tail);
    resetClassic();
    showScreen('game');
    setClassicHud();
    updateHud();
    overOverlay.classList.add('hidden');
    completeOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    state = 'playing';
    startTime = performance.now();
    soundStart();
  }

  function completeNext() {
    if (level.id < 12) openLevel(level.id + 1);
    else showScreen('levels');
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      pauseStart = performance.now();
      pauseOverlay.classList.remove('hidden');
    } else if (state === 'paused') {
      state = 'playing';
      if (danger) graceUntil += performance.now() - pauseStart;
      pauseOverlay.classList.add('hidden');
    }
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  let headRgb = hexToRgb(CLASSIC_THEME.head);
  let tailRgb = hexToRgb(CLASSIC_THEME.tail);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function snakeColor(ratio) {
    const c = headRgb.map((h, i) => Math.round(lerp(h, tailRgb[i], ratio)));
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawEyes(cx, cy) {
    const fx = dir.x * CELL * 0.16;
    const fy = dir.y * CELL * 0.16;
    const px = -dir.y * CELL * 0.17;
    const py = dir.x * CELL * 0.17;
    for (const s of [1, -1]) {
      const ex = cx + fx + px * s;
      const ey = cy + fy + py * s;
      ctx.beginPath();
      ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + dir.x * 1.2, ey + dir.y * 1.2, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    }
  }

  function render(now, t) {
    ctx.fillStyle = theme.board;
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = theme.checker;
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, SIZE);
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(SIZE, i * CELL + 0.5);
    }
    ctx.stroke();

    for (const c of obstacleCells) {
      ctx.fillStyle = theme.obstacle;
      roundRectPath(c.x * CELL + 1.5, c.y * CELL + 1.5, CELL - 3, CELL - 3, c.edge ? 4 : 7);
      ctx.fill();
      if (theme.emoji && !c.edge) {
        ctx.font = Math.floor(CELL * 0.72) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(theme.emoji, c.x * CELL + CELL / 2, c.y * CELL + CELL / 2 + 1);
      }
    }

    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const pulse = 1 + 0.1 * Math.sin(now / 280);
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL * 0.95 * pulse);
    glow.addColorStop(0, 'rgba(255,209,102,0.5)');
    glow.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - CELL, fy - CELL, CELL * 2, CELL * 2);
    ctx.font = Math.floor(CELL * 0.8) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mode === 'adventure' && level ? level.food : '🍎', fx, fy + 1);

    for (let i = snake.length - 1; i >= 0; i--) {
      const curr = snake[i];
      const prev = prevSnake[i] || curr;
      const px = lerp(prev.x, curr.x, t) * CELL;
      const py = lerp(prev.y, curr.y, t) * CELL;
      const ratio = snake.length > 1 ? i / (snake.length - 1) : 0;
      ctx.fillStyle = danger && i === 0 ? '#ef4444' : snakeColor(ratio);
      roundRectPath(px + 1.5, py + 1.5, CELL - 3, CELL - 3, 7);
      ctx.fill();
      if (i === 0) drawEyes(px + CELL / 2, py + CELL / 2);
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = '700 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const f of floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(f.text, f.x * CELL + CELL / 2, f.y * CELL - 4);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(100, now - lastFrame);
    lastFrame = now;
    if (state === 'playing') {
      if (danger) {
        const active = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
        if (isSafeDir(active)) {
          dir = active;
          dirQueue = [];
          endGrace();
        } else if (now >= graceUntil) {
          die();
        }
      }
      if (state === 'playing' && !danger) {
      acc += dt;
      while (acc >= interval && state === 'playing') {
        acc -= interval;
        step();
      }
      }
      render(now, state === 'playing' && !danger ? Math.min(1, acc / interval) : 1);
    } else if (state !== 'menu' && state !== 'levels') {
      render(now, 1);
    }
    updateFx(dt);
  }

  function fmtDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? m + ' 分 ' + s + ' 秒' : s + ' 秒';
  }

  function fmtDate(t) {
    const d = new Date(t);
    const pad = (n) => String(n).padStart(2, '0');
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (!history.length) {
      historyEmpty.style.display = '';
      historySummary.textContent = '共 0 局 · 平均 0 分';
      return;
    }
    historyEmpty.style.display = 'none';
    const total = history.reduce((sum, r) => sum + (r.s || 0), 0);
    historySummary.textContent = '共 ' + history.length + ' 局 · 平均 ' + Math.round(total / history.length) + ' 分';
    for (const r of history) {
      const li = document.createElement('li');
      li.className = 'history-item';
      const score = document.createElement('span');
      score.className = 'history-score';
      score.textContent = (r.s || 0) + ' 分';
      const meta = document.createElement('span');
      meta.className = 'history-meta';
      meta.textContent = (r.m || '经典') + ' · 食物 ' + (r.f || 0) + ' · 用时 ' + fmtDuration(r.d || 0);
      const date = document.createElement('span');
      date.className = 'history-meta';
      date.textContent = fmtDate(r.t || Date.now());
      li.appendChild(score);
      li.appendChild(meta);
      li.appendChild(date);
      historyList.appendChild(li);
    }
  }

  function openHistory() {
    if (state === 'menu' || state === 'levels') {
      showScreen('game');
      render(performance.now(), 1);
    }
    renderHistory();
    historyPause = state === 'playing';
    if (historyPause) state = 'paused';
    historyOverlay.classList.remove('hidden');
  }

  function closeHistory() {
    historyOverlay.classList.add('hidden');
    if (historyPause) {
      historyPause = false;
      state = 'playing';
    } else if (state === 'menu') {
      showScreen('menu');
    } else if (state === 'levels') {
      showScreen('levels');
    }
  }

  function clearHistory() {
    if (!clearArmed) {
      clearArmed = true;
      clearHistoryBtn.textContent = '确认清空？';
      clearHistoryBtn.classList.add('danger');
      clearTimer = setTimeout(() => {
        clearArmed = false;
        clearHistoryBtn.textContent = '清空记录';
        clearHistoryBtn.classList.remove('danger');
      }, 3000);
      return;
    }
    clearTimeout(clearTimer);
    clearArmed = false;
    clearHistoryBtn.textContent = '清空记录';
    clearHistoryBtn.classList.remove('danger');
    history = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (err) {}
    renderHistory();
  }

  function steer(next) {
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (danger) {
      if (next.x === -last.x && next.y === -last.y) return;
      if (next.x === last.x && next.y === last.y) return;
      dir = next;
      dirQueue = [];
      return;
    }
    while (dirQueue.length) {
      const tail = dirQueue[dirQueue.length - 1];
      if (next.x !== -tail.x || next.y !== -tail.y) break;
      dirQueue.pop();
    }
    const head = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (next.x === -head.x && next.y === -head.y) return;
    if (next.x === head.x && next.y === head.y) return;
    if (dirQueue.length < 3) dirQueue.push(next);
  }

  const KEY_DIRS = {
    ArrowUp: DIRS.up,
    ArrowDown: DIRS.down,
    ArrowLeft: DIRS.left,
    ArrowRight: DIRS.right,
    w: DIRS.up,
    s: DIRS.down,
    a: DIRS.left,
    d: DIRS.right,
    W: DIRS.up,
    S: DIRS.down,
    A: DIRS.left,
    D: DIRS.right
  };

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (KEY_DIRS[key] || key === ' ') e.preventDefault();
    if (key === ' ') {
      if (state === 'intro') startLevelRun();
      else if (state === 'playing' || state === 'paused') togglePause();
      else if (state === 'over') overPrimaryBtn.click();
      else if (state === 'complete') completeNext();
      return;
    }
    if (key === 'Enter') {
      if (state === 'intro') startLevelRun();
      else if (state === 'over') overPrimaryBtn.click();
      return;
    }
    if (key === 'r' || key === 'R') {
      if (mode === 'adventure' && level && state !== 'menu' && state !== 'levels') openLevel(level.id);
      else if (mode === 'classic' && state !== 'menu' && state !== 'levels') startClassic();
      return;
    }
    const next = KEY_DIRS[key];
    if (!next || state !== 'playing') return;
    steer(next);
  });

  document.getElementById('adventureBtn').addEventListener('click', () => showScreen('levels'));
  document.getElementById('classicBtn').addEventListener('click', startClassic);
  document.getElementById('backMenuBtn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('introStartBtn').addEventListener('click', startLevelRun);
  document.getElementById('resumeBtn').addEventListener('click', togglePause);
  overPrimaryBtn.addEventListener('click', () => {
    if (mode === 'adventure') openLevel(level.id);
    else startClassic();
  });
  overSecondaryBtn.addEventListener('click', () => {
    if (mode === 'adventure') showScreen('levels');
    else showScreen('menu');
  });
  nextLevelBtn.addEventListener('click', completeNext);
  document.getElementById('replayBtn').addEventListener('click', () => openLevel(level.id));
  document.getElementById('completeBackBtn').addEventListener('click', () => showScreen('levels'));

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
  });

  historyBtn.addEventListener('click', openHistory);
  closeHistoryBtn.addEventListener('click', closeHistory);
  clearHistoryBtn.addEventListener('click', clearHistory);
  historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) closeHistory();
  });

  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => {
    if (!touchStart || state !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    const next = Math.abs(dx) > Math.abs(dy)
      ? { x: dx > 0 ? 1 : -1, y: 0 }
      : { x: 0, y: dy > 0 ? 1 : -1 };
    steer(next);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') togglePause();
  });

  showScreen('menu');
  requestAnimationFrame(frame);
})();
