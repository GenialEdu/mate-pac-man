/* Mate Pac-Man WEB — prototipo Nivel 0 y Nivel 1 (1-1 a 1-5).
   Sin dependencias: solo Canvas + JS. Funciona en Brave, Firefox, Chrome, Edge.
   Lógica espejo del generador Python (pacman/math_quiz.py) para Nivel 1. */
'use strict';

/* ---------- Mapa (19 x 15). X = muro, resto = camino ---------- */
const MAP = [
  'XXXXXXXXXXXXXXXXXXX',
  'X........X........X',
  'X.XX.XXX.X.XXX.XX.X',
  'X.................X',
  'X.XX.X.XXXXX.X.XX.X',
  'X....X...X...X....X',
  'XXXX.XXX...XXX.XXXX',
  'XXXX.X.......X.XXXX',
  'XXXX.X.......X.XXXX',
  'X......X...X......X',
  'X.XX...X.X.X...XX.X',
  'X.....X.....X.....X',
  'X.XXX.XX.X.XX.XXX.X',
  'X.................X',
  'XXXXXXXXXXXXXXXXXXX'
];
const COLS = 19, ROWS = 15, TILE = 30;
const PAC_SPAWN = { x: 8, y: 11 };
const GHOST_SPAWNS = [{ x: 1, y: 1 }, { x: 17, y: 1 }, { x: 1, y: 13 }, { x: 17, y: 13 }];
const ANSWER_SLOTS = [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 11 }, { x: 15, y: 11 }];
/* Casillas extra por si Pac está parado sobre un slot al salir pregunta nueva */
const SPARE_SLOTS = [{ x: 9, y: 3 }, { x: 5, y: 1 }, { x: 13, y: 1 }, { x: 9, y: 13 }, { x: 5, y: 11 }, { x: 13, y: 11 }];
/* La meta de aciertos de cada nivel/subnivel se cambia en LEVELS, campo goal.
   Ej: goal: 3 en Nivel 0, goal: 5 en el resto. El marcador y la victoria
   lo leen de ahí automáticamente, no hay que tocar nada más. */

/* ---------- Config por nivel ---------- */
const LEVELS = {
  0: { label: 'Nivel 0 · Súper fácil', sub: 1, gen: 1, ghosts: 1, factor: 0.35, chase: 0.0, pac: 6.4, goal: 3, infinite: true,
       desc: 'Tutorial sin presión: sumas y restas del 1 al 10. El fantasma pasea sin cazarte y tienes vidas infinitas. Meta: 3 aciertos.' },
  1: { label: 'Nivel 1-1 · Sumas 1-10', sub: 1, gen: 1, ghosts: 2, factor: 0.55, chase: 0.12, pac: 6.2, goal: 5,
       desc: 'Sumas de dos números del 1 al 10. 2 fantasmas lentos. Meta: 5 aciertos.' },
  2: { label: 'Nivel 1-2 · Restas 1-10', sub: 2, gen: 1, ghosts: 2, factor: 0.60, chase: 0.15, pac: 6.2, goal: 5,
       desc: 'Restas del 1 al 10 sin resultados negativos. 2 fantasmas. Meta: 5 aciertos.' },
  3: { label: 'Nivel 1-3 · 3 operandos', sub: 3, gen: 1, ghosts: 3, factor: 0.70, chase: 0.25, pac: 6.4, goal: 5,
       desc: 'Tres operandos encadenados hasta el 20, p. ej. 6+4−3. 3 fantasmas.' },
  4: { label: 'Nivel 1-4 · x y ÷', sub: 4, gen: 1, ghosts: 3, factor: 0.80, chase: 0.35, pac: 6.6, goal: 5,
       desc: 'Tablas de multiplicar y divisiones exactas. 3 fantasmas más rápidos.' },
  5: { label: 'Nivel 1-5 · Mixto', sub: 5, gen: 1, ghosts: 4, factor: 0.88, chase: 0.45, pac: 6.8, goal: 5,
       desc: 'Mixto con jerarquía, p. ej. 2+3×4. 4 fantasmas. Jefe final de aritmética.' },
  6: { label: 'Nivel 2-1 · Simplificar', sub: 1, gen: 2, ghosts: 2, factor: 0.60, chase: 0.18, pac: 6.2, goal: 5,
       desc: 'Fracciones: simplifica hasta su mínima expresión, p. ej. 4/6 = 2/3. 2 fantasmas.' },
  7: { label: 'Nivel 2-2 · Mismo denominador', sub: 2, gen: 2, ghosts: 2, factor: 0.65, chase: 0.20, pac: 6.4, goal: 5,
       desc: 'Suma y resta con igual denominador, p. ej. 2/5+1/5. 2 fantasmas.' },
  8: { label: 'Nivel 2-3 · Distinto denominador', sub: 3, gen: 2, ghosts: 3, factor: 0.72, chase: 0.28, pac: 6.4, goal: 5,
       desc: 'Suma y resta con distinto denominador y simplifica, p. ej. 3/4+1/2. 3 fantasmas.' },
  9: { label: 'Nivel 2-4 · x y ÷ de fracciones', sub: 4, gen: 2, ghosts: 3, factor: 0.80, chase: 0.35, pac: 6.6, goal: 5,
       desc: 'Multiplicación y división de fracciones. 3 fantasmas rápidos.' },
  10: { label: 'Nivel 2-5 · Combinadas', sub: 5, gen: 2, ghosts: 4, factor: 0.88, chase: 0.42, pac: 6.8, goal: 5,
        desc: 'Tres fracciones combinadas, p. ej. 3/4+2/4−1/4. 4 fantasmas. Jefe final de fracciones.' },
  11: { label: 'Nivel 3-1 · Multiplica signos', sub: 1, gen: 3, ghosts: 2, factor: 0.62, chase: 0.20, pac: 6.2, goal: 5,
        desc: 'Producto de enteros con signo, p. ej. (−3)×(+4). 2 fantasmas.' },
  12: { label: 'Nivel 3-2 · Enteros +−', sub: 2, gen: 3, ghosts: 2, factor: 0.68, chase: 0.24, pac: 6.4, goal: 5,
        desc: 'Suma y resta de −20 a 20, p. ej. (6)−(−1). 2 fantasmas.' },
  13: { label: 'Nivel 3-3 · Signos 3 operandos', sub: 3, gen: 3, ghosts: 3, factor: 0.75, chase: 0.30, pac: 6.4, goal: 5,
        desc: 'Tres operandos con signo, p. ej. (1)×(−4)+(6). 3 fantasmas.' },
  14: { label: 'Nivel 3-4 · Potencias y raíz', sub: 4, gen: 3, ghosts: 3, factor: 0.82, chase: 0.36, pac: 6.6, goal: 5,
        desc: 'Potencias con base negativa y raíces exactas, p. ej. (−2)³ o √100. 3 fantasmas.' },
  15: { label: 'Nivel 3-5 · Paréntesis jefe', sub: 5, gen: 3, ghosts: 4, factor: 0.90, chase: 0.45, pac: 6.8, goal: 5,
        desc: 'Menos delante de paréntesis, p. ej. −((−8)+(−7)). 4 fantasmas. Jefe de signos.' },
  16: { label: 'Nivel 4-1 · Despeja x', sub: 1, gen: 4, ghosts: 2, factor: 0.65, chase: 0.22, pac: 6.2, goal: 5,
        desc: 'Ecuaciones x+a=b: come el valor de x. 2 fantasmas.' },
  17: { label: 'Nivel 4-2 · ax+b=c', sub: 2, gen: 4, ghosts: 3, factor: 0.72, chase: 0.28, pac: 6.4, goal: 5,
        desc: 'Ecuaciones de dos pasos, p. ej. 6x+8=38. 3 fantasmas.' },
  18: { label: 'Nivel 4-3 · ax−b=c', sub: 3, gen: 4, ghosts: 3, factor: 0.78, chase: 0.33, pac: 6.6, goal: 5,
        desc: 'Ecuaciones con resta, p. ej. 4x−10=−2. 3 fantasmas.' },
  19: { label: 'Nivel 4-4 · Evalúa', sub: 4, gen: 4, ghosts: 4, factor: 0.84, chase: 0.38, pac: 6.8, goal: 5,
        desc: 'Sustituye x en la expresión, p. ej. si x=5, 1x+(−7). 4 fantasmas.' },
  20: { label: 'Nivel 4-5 · Cuadrática jefe', sub: 5, gen: 4, ghosts: 4, factor: 0.90, chase: 0.46, pac: 7.0, goal: 5,
        desc: 'x²−Sx+P=0 factorizable: come una solución. 4 fantasmas. Jefe de álgebra.' },
  21: { label: 'Nivel 5-1 · Seno y coseno', sub: 1, gen: 5, ghosts: 3, factor: 0.68, chase: 0.25, pac: 6.4, goal: 5,
        desc: 'Valores notables: sin(30°), cos(60°)... 3 fantasmas.' },
  22: { label: 'Nivel 5-2 · Notables', sub: 2, gen: 5, ghosts: 3, factor: 0.74, chase: 0.30, pac: 6.6, goal: 5,
        desc: 'Más notables: 45°, 60°, tangentes. 3 fantasmas.' },
  23: { label: 'Nivel 5-3 · Pitágoras', sub: 3, gen: 5, ghosts: 4, factor: 0.80, chase: 0.36, pac: 6.8, goal: 5,
        desc: 'Halla hipotenusa o cateto en ternas clásicas. 4 fantasmas.' },
  24: { label: 'Nivel 5-4 · Grados y radianes', sub: 4, gen: 5, ghosts: 4, factor: 0.86, chase: 0.42, pac: 7.0, goal: 5,
        desc: 'Convierte 180°↔π, 90°↔π/2... 4 fantasmas.' },
  25: { label: 'Nivel 5-5 · Identidad jefe', sub: 5, gen: 5, ghosts: 4, factor: 0.92, chase: 0.48, pac: 7.0, goal: 5,
        desc: 'sin²+cos² y cierre de trigonometría. 4 fantasmas. Jefe final del juego.' }
};
const GHOST_COLORS = ['#ff2b2b', '#ff9de2', '#00e5ff', '#ffb84d'];
const LEVEL_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
function nextLevelKey() {
  const i = LEVEL_ORDER.indexOf(state.levelKey);
  return (i >= 0 && i < LEVEL_ORDER.length - 1) ? LEVEL_ORDER[i + 1] : null;
}

/* ---------- Estado ---------- */
const state = {
  screen: 'menu', // menu | playing | paused | win | lose
  levelKey: 1,
  prompt: '', choices: [], correct: '',
  ok: 0, lives: 3, score: 0, dotsEaten: 0,
  dots: null, answers: [],
  pac: null, ghosts: [],
  elapsed: 0, wakaHigh: false, flash: 0, good: 0, calm: false, task: null,
  wild: { x: 0, y: 0, active: false, ttl: 0 }, wildTimer: 8,
  player: { name: '', avatar: 'Σ' }
};

/* ---------- Perfil y estadísticas (localStorage del navegador) ----------
   Se guardan en el navegador: sobreviven al cerrar la pestaña, pero se
   borran si borras los datos del sitio. No salen de tu PC. */
const AVATARS = ['Σ', 'π', '√', '∞', 'Δ', 'φ', '±', '%'];
function loadJSON(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* modo privado: se juega sin guardar */ }
}
state.player = loadJSON('matepacman_profile', { name: '', avatar: 'Σ' });
if (!AVATARS.includes(state.player.avatar)) state.player.avatar = 'Σ';
let STATS = loadJSON('matepacman_stats', { plays: 0, ok: 0 });
function saveProfile() { saveJSON('matepacman_profile', state.player); }
function saveStats() { saveJSON('matepacman_stats', STATS); }
function playerTag() {
  const n = (state.player.name || '').trim() || 'Anónimo';
  return n + ' ' + state.player.avatar;
}
/* Fin de partida: récord del nivel + acumulados globales + registro para docente */
function gameOver(won) {
  saveBest();
  STATS.ok += state.ok;
  saveStats();
  logResult(won);
}
/* ---------- Tareas del docente: código corto "<nivel>-<meta>[-flags]" ----------
   Ej: "8-7" (nivel 8, meta 7 aciertos), "8-7-S" (sin comodín),
   "0-3-T" (modo tranquilo forzado). El docente las crea en docente.html;
   el alumno escribe el código en el menú y juega con esas reglas. */
function parseTask(code) {
  const m = /^(\d{1,2})-(\d{1,2})(?:-([a-z]+))?$/i.exec((code || '').trim());
  if (!m) return null;
  const level = parseInt(m[1], 10), goal = parseInt(m[2], 10);
  if (LEVELS[level] === undefined || goal < 1 || goal > 30) return null;
  const fl = (m[3] || '').toUpperCase();
  return { code: level + '-' + goal + (fl ? '-' + fl : ''), level, goal, noWild: fl.indexOf('S') >= 0, forceCalm: fl.indexOf('T') >= 0 };
}
function goalNow() { return (state.task && state.task.goal) || LEVELS[state.levelKey].goal; }
function calmOn() { return state.calm || (state.task && state.task.forceCalm); }
function wildOff() { return !!(state.task && state.task.noWild); }
function taskTag() { return state.task ? ' · Tarea ' + state.task.code : ''; }
function startTask(code) {
  const t = parseTask(code);
  if (!t) return null;
  state.task = t;
  startGame(t.level);
  return t;
}
/* Reenvía al docente los resultados guardados en este navegador
   (p. ej. partidas practicadas en casa). Con id único: si reenvías dos
   veces, el servidor ignora los repetidos. Lo enviado se borra local. */
async function resendResults() {
  const msg = (t, ok) => {
    if (typeof document === 'undefined') return;
    el('taskMsg').textContent = t;
    el('taskMsg').style.color = ok ? '#8f8' : '#f88';
  };
  let arr = [];
  try { arr = loadJSON('matepacman_results', []); } catch (e) { arr = []; }
  if (!arr.length) {
    msg('No tienes resultados guardados en este dispositivo.', false);
    return { sent: 0, total: 0 };
  }
  if (typeof fetch === 'undefined' || typeof location === 'undefined' ||
      !location.protocol || location.protocol.indexOf('http') !== 0) {
    msg('Sin servidor de aula: abre el juego desde http://IP-del-docente:8000 para enviar.', false);
    return { sent: 0, total: arr.length };
  }
  arr.forEach(r => {
    if (!r.id) r.id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  });
  let sent = 0;
  const pending = [];
  for (const r of arr) {
    try {
      const resp = await fetch('api/result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
      if (resp && resp.ok) sent++;
      else pending.push(r);
    } catch (e) { pending.push(r); }
  }
  saveJSON('matepacman_results', pending);
  if (sent) msg('Enviados ' + sent + ' de ' + arr.length + ' resultados al docente.', true);
  else msg('No se pudo conectar con el servidor. Inténtalo en el aula.', false);
  return { sent, total: arr.length };
}
/* Resultado: siempre se guarda en este navegador; si la página viene del
   servidor de aula, además se envía a la PC del docente (sin bloquear). */
function logResult(won) {
  const r = {
    id: 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    ts: new Date().toISOString(),
    player: { name: (state.player.name || '').trim() || 'Anónimo', avatar: state.player.avatar },
    taskCode: state.task ? state.task.code : '',
    levelKey: state.levelKey,
    level: LEVELS[state.levelKey].label,
    ok: state.ok, goal: goalNow(), score: state.score,
    timeSec: Math.round(state.elapsed), won: !!won
  };
  try {
    const arr = loadJSON('matepacman_results', []);
    arr.push(r);
    while (arr.length > 200) arr.shift();
    saveJSON('matepacman_results', arr);
  } catch (e) { /* sin registro local */ }
  try {
    if (typeof fetch !== 'undefined' && typeof location !== 'undefined' &&
        location.protocol && location.protocol.indexOf('http') === 0) {
      fetch('api/result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).catch(function () {});
    }
  } catch (e) { /* sin servidor: solo queda local */ }
}
/* Elegir nivel manualmente (jugadores avanzados): solo selecciona,
   JUGAR empieza. Muestra de qué trata cada nivel. */
const GROUPS = [
  { title: 'Nivel 0 · Súper fácil', keys: [0] },
  { title: 'Nivel 1 · Aritmética', keys: [1, 2, 3, 4, 5] },
  { title: 'Nivel 2 · Fracciones', keys: [6, 7, 8, 9, 10] },
  { title: 'Nivel 3 · Signos', keys: [11, 12, 13, 14, 15] },
  { title: 'Nivel 4 · Álgebra', keys: [16, 17, 18, 19, 20] },
  { title: 'Nivel 5 · Trigonometría', keys: [21, 22, 23, 24, 25] }
];
function getBestFor(k) {
  try {
    if (typeof localStorage === 'undefined') return 0;
    return parseInt(localStorage.getItem('matepacman_best_' + k) || '0', 10);
  } catch (e) { return 0; }
}
/* Refresca contadores "superados/total" y abre/cierra cuerpos del acordeón */
function refreshGroups() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('#levelBtns .grp').forEach(gr => {
    const keys = (gr.dataset.keys || '').split(',').filter(Boolean).map(Number);
    const done = keys.filter(k => getBestFor(k) > 0).length;
    const cnt = gr.querySelector('.cnt');
    if (cnt) cnt.textContent = done + '/' + keys.length;
    const body = gr.querySelector('.grpBody');
    if (body) body.style.display = gr.classList.contains('open') ? '' : 'none';
  });
}
function selectLevel(k) {
  state.levelKey = k;
  state.task = null; // juego libre: sin tarea
  if (typeof document === 'undefined') return;
  document.querySelectorAll('#levelBtns .lvl').forEach(x => {
    x.classList.toggle('sel', x.dataset.key === String(k));
  });
  document.querySelectorAll('#levelBtns .grp').forEach(gr => {
    const keys = (gr.dataset.keys || '').split(',').filter(Boolean);
    gr.classList.toggle('open', keys.includes(String(k)));
  });
  refreshGroups();
  el('lvlDesc').textContent = LEVELS[k].desc;
  el('btnStart').textContent = 'JUGAR ' + LEVELS[k].label;
  syncHud();
}

/* ---------- Utilidades ---------- */
function rnd(n) { return Math.floor(Math.random() * n); }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function tileCenter(t) { return t * TILE + TILE / 2; }
function isFree(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
  return MAP[ty][tx] !== 'X';
}

/* ---------- Generador Nivel 1 (aleatorio) ---------- */
function intDistractors(correct) {
  const cands = new Set();
  const pool = [1, -1, 2, -2, 3, -3, 10, -10];
  shuffle(pool);
  for (const d of pool) cands.add(correct + d);
  cands.add(-correct);
  cands.add(correct + 11);
  cands.delete(correct);
  const arr = shuffle(Array.from(cands)).slice(0, 3);
  return arr.map(String);
}
function genQuestion(sub) {
  let prompt, correct;
  const R = (a, b) => a + rnd(b - a + 1);
  if (sub === 1) {
    const a = R(1, 10), b = R(1, 10);
    prompt = a + ' + ' + b + ' = ?'; correct = a + b;
  } else if (sub === 2) {
    let a = R(1, 10), b = R(1, 10);
    if (b > a) { const t = a; a = b; b = t; }
    prompt = a + ' − ' + b + ' = ?'; correct = a - b;
  } else if (sub === 3) {
    const a = R(1, 20), b = R(1, 20), c = R(1, 20);
    const o1 = Math.random() < 0.5 ? '+' : '−', o2 = Math.random() < 0.5 ? '+' : '−';
    const v = o1 === '+' ? a + b : a - b;
    correct = o2 === '+' ? v + c : v - c;
    prompt = a + ' ' + o1 + ' ' + b + ' ' + o2 + ' ' + c + ' = ?';
  } else if (sub === 4) {
    if (Math.random() < 0.5) {
      const a = R(2, 10), b = R(2, 10);
      prompt = a + ' × ' + b + ' = ?'; correct = a * b;
    } else {
      const b = R(2, 10), r = R(2, 10);
      prompt = (b * r) + ' ÷ ' + b + ' = ?'; correct = r;
    }
  } else {
    const a = R(2, 9), b = R(2, 9), c = R(1, 20);
    if (Math.random() < 0.5) { prompt = a + ' + ' + b + ' × ' + c + ' = ?'; correct = a + b * c; }
    else { prompt = a + ' × ' + b + ' + ' + c + ' = ?'; correct = a * b + c; }
  }
  const choices = shuffle([String(correct)].concat(intDistractors(correct)));
  return { prompt, choices, correct: String(correct) };
}

/* ---------- Generador Nivel 2: fracciones (aleatorio) ---------- */
function makeChoices(correct, distractors) {
  const pool = [];
  for (const d of distractors) {
    if (d !== correct && !pool.includes(d)) pool.push(d);
  }
  let extra = 1;
  while (pool.length < 3 && extra < 60) {
    let cand;
    if (correct.includes('/')) {
      const parts = correct.split('/');
      const num = parseInt(parts[0], 10);
      cand = isNaN(num) ? correct + '·' + extra : (num + extra) + '/' + parts[1];
    } else {
      const base = parseInt(correct, 10);
      cand = isNaN(base) ? correct + '*' + extra : String(base + extra * 7);
    }
    if (cand !== correct && !pool.includes(cand)) pool.push(cand);
    extra++;
  }
  return shuffle([correct].concat(pool.slice(0, 3)));
}
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}
function fmtFr(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d); n /= g; d /= g;
  if (d === 1) return String(n);
  return n + '/' + d;
}
function genQuestion2(sub) {
  const R = (a, b) => a + rnd(b - a + 1);
  if (sub === 1) { // simplificar
    const d = [2, 4, 8, 3, 6, 9][rnd(6)];
    const n = R(1, d - 1);
    const c = fmtFr(n, d);
    const dist = [fmtFr(n + 1, d), fmtFr(n, d + 1), fmtFr(Math.max(1, n - 1), d), fmtFr(n + 2, d)];
    return { prompt: 'Simplifica ' + n + '/' + d + ' = ?', choices: makeChoices(c, dist), correct: c };
  }
  if (sub === 2) { // mismo denominador
    const d = R(2, 9);
    let a = R(1, d - 1), b = R(1, d - 1);
    const op = Math.random() < 0.5 ? '+' : '−';
    if (op === '−' && b > a) { const t = a; a = b; b = t; }
    const c = fmtFr(op === '+' ? a + b : a - b, d);
    const dist = [(a + b) + '/' + (d + 1), fmtFr(a + b + 1, d), fmtFr(Math.abs(a - b) + 1, d), (a + b) + '/' + d];
    return { prompt: a + '/' + d + ' ' + op + ' ' + b + '/' + d + ' = ?', choices: makeChoices(c, dist), correct: c };
  }
  if (sub === 3) { // distinto denominador
    const d1 = R(2, 9), d2 = R(2, 9);
    const a = R(1, d1), b = R(1, d2);
    let op = Math.random() < 0.5 ? '+' : '−', num, den = d1 * d2;
    if (op === '−' && a * d2 - b * d1 <= 0) op = '+';
    num = op === '+' ? a * d2 + b * d1 : a * d2 - b * d1;
    const c = fmtFr(num, den);
    const dist = [(a + b) + '/' + (d1 + d2), fmtFr(num + den, den), fmtFr(Math.abs(num - den), den), fmtFr(num + 1, den)];
    return { prompt: a + '/' + d1 + ' ' + op + ' ' + b + '/' + d2 + ' = ?', choices: makeChoices(c, dist), correct: c };
  }
  if (sub === 4) { // multiplicación y división
    const a = R(1, 8), b = R(1, 8), d1 = R(2, 9), d2 = R(2, 9);
    let c, prompt;
    if (Math.random() < 0.5) {
      c = fmtFr(a * b, d1 * d2);
      prompt = a + '/' + d1 + ' × ' + b + '/' + d2 + ' = ?';
    } else {
      c = fmtFr(a * d2, d1 * b);
      prompt = a + '/' + d1 + ' ÷ ' + b + '/' + d2 + ' = ?';
    }
    const dist = [fmtFr(a * b + 1, d1 * d2), fmtFr(a * b, d1 * d2 + 1), fmtFr(a * d2 + 1, d1 * b), fmtFr(a * d2, d1 * b + 1)];
    return { prompt, choices: makeChoices(c, dist), correct: c };
  }
  // sub 5: combinada de 3 fracciones
  const ds = [2, 3, 4, 6], d = ds[rnd(4)];
  let a = d, b = d, c3 = d, r = d, tries = 0;
  do { a = R(1, d); b = R(1, d); c3 = R(1, d); r = a + b - c3; tries++; } while (r <= 0 && tries < 20);
  if (r <= 0) { a = d; b = d; c3 = d; r = d; }
  const c = fmtFr(r, d);
  const dist = [fmtFr(r + 1, d), (a + b + c3) + '/' + d, fmtFr((Math.abs(r - 1) || 1), d), fmtFr(r + 2, d)];
  return { prompt: a + '/' + d + ' + ' + b + '/' + d + ' − ' + c3 + '/' + d + ' = ?', choices: makeChoices(c, dist), correct: c };
}

/* ---------- Generador Nivel 3: ley de los signos / enteros ---------- */
function genQuestion3(sub) {
  const R = (a, b) => a + rnd(b - a + 1);
  const ints = r => shuffle([String(r)].concat(intDistractors(r)));
  if (sub === 1) {
    const a = R(2, 9), b = R(2, 9);
    const s1 = Math.random() < 0.5 ? -1 : 1, s2 = Math.random() < 0.5 ? -1 : 1;
    const r = s1 * a * s2 * b, c = String(r);
    return { prompt: '(' + (s1 * a) + ') × (' + (s2 * b) + ') = ?', choices: makeChoices(c, [String(-r), String(Math.abs(r) + 1), String(Math.abs(r) - 1), String(r + 2)]), correct: c };
  }
  if (sub === 2) {
    const a = R(-20, 20), b = R(-20, 20);
    const op = Math.random() < 0.5 ? '+' : '−';
    const r = op === '+' ? a + b : a - b;
    return { prompt: '(' + a + ') ' + op + ' (' + b + ') = ?', choices: ints(r), correct: String(r) };
  }
  if (sub === 3) {
    const a = R(-9, 9), b = R(-9, 9), c = R(-9, 9);
    const r = a * b + c;
    return { prompt: '(' + a + ') × (' + b + ') + (' + c + ') = ?', choices: ints(r), correct: String(r) };
  }
  if (sub === 4) {
    if (Math.random() < 0.6) {
      const base = R(-5, 5), exp = Math.random() < 0.5 ? 2 : 3;
      const r = Math.pow(base, exp), c = String(r);
      return { prompt: '(' + base + ')^' + exp + ' = ?', choices: makeChoices(c, [String(-r), String(Math.abs(r)), String(r + 1), String(r - 1)]), correct: c };
    }
    const r = R(2, 12);
    return { prompt: '√' + (r * r) + ' = ?', choices: ints(r), correct: String(r) };
  }
  const a = R(-9, 9), b = R(-9, 9), r = -(a + b);
  const prompt = (a >= 0 && b >= 0) ? '−(' + a + ' + ' + b + ') = ?' : '−((' + a + ') + (' + b + ')) = ?';
  return { prompt, choices: ints(r), correct: String(r) };
}

/* ---------- Generador Nivel 4: álgebra ---------- */
function genQuestion4(sub) {
  const R = (a, b) => a + rnd(b - a + 1);
  const ints = r => shuffle([String(r)].concat(intDistractors(r)));
  if (sub === 1) {
    const a = R(1, 20), x = R(1, 20);
    return { prompt: 'x + ' + a + ' = ' + (a + x) + '.  x = ?', choices: ints(x), correct: String(x) };
  }
  if (sub === 2) {
    const a = R(2, 9), x = R(1, 12), b = R(1, 20);
    return { prompt: a + 'x + ' + b + ' = ' + (a * x + b) + '.  x = ?', choices: ints(x), correct: String(x) };
  }
  if (sub === 3) {
    const a = R(2, 9), x = R(1, 12), b = R(1, 20);
    return { prompt: a + 'x − ' + b + ' = ' + (a * x - b) + '.  x = ?', choices: ints(x), correct: String(x) };
  }
  if (sub === 4) {
    const x = R(-5, 5), a = R(1, 6), b = R(-9, 9), r = a * x + b;
    return { prompt: 'Si x = ' + x + ',  ' + a + 'x + (' + b + ') = ?', choices: ints(r), correct: String(r) };
  }
  const r1 = R(1, 9), r2 = R(1, 9), s = r1 + r2, p = r1 * r2;
  const dist = (r1 === r2) ? [String(r1 + 1), String(r1 - 1), String(s)] : [String(r2), String(s), String(p)];
  return { prompt: 'x² − ' + s + 'x + ' + p + ' = 0.  x = ? (una solución)', choices: makeChoices(String(r1), dist), correct: String(r1) };
}

/* ---------- Generador Nivel 5: trigonometría ---------- */
const NOTABLES = [
  ['sin(30°)', '1/2'], ['cos(60°)', '1/2'], ['sin(0°)', '0'], ['cos(0°)', '1'],
  ['tan(45°)', '1'], ['sin(45°)', '√2/2'], ['cos(45°)', '√2/2'],
  ['sin(60°)', '√3/2'], ['cos(30°)', '√3/2'], ['tan(30°)', '√3/3']
];
function genQuestion5(sub) {
  const R = (a, b) => a + rnd(b - a + 1);
  const ints = r => shuffle([String(r)].concat(intDistractors(r)));
  if (sub <= 2) {
    const qi = rnd(NOTABLES.length);
    const q = NOTABLES[qi][0], ans = NOTABLES[qi][1];
    const pool = [];
    for (const n of NOTABLES) if (n[1] !== ans && !pool.includes(n[1])) pool.push(n[1]);
    return { prompt: q + ' = ?', choices: makeChoices(ans, shuffle(pool).slice(0, 6)), correct: ans };
  }
  if (sub === 3) {
    const tr = [[3, 4, 5], [6, 8, 10], [5, 12, 13]][rnd(3)];
    if (Math.random() < 0.5) {
      return { prompt: 'Catetos ' + tr[0] + ' y ' + tr[1] + '. Hipotenusa = ?', choices: ints(tr[2]), correct: String(tr[2]) };
    }
    return { prompt: 'Hipotenusa ' + tr[2] + ', cateto ' + tr[0] + '. Otro cateto = ?', choices: ints(tr[1]), correct: String(tr[1]) };
  }
  if (sub === 4) {
    const pairs = [['180°', 'π'], ['90°', 'π/2'], ['60°', 'π/3'], ['45°', 'π/4'], ['30°', 'π/6']];
    const pr = pairs[rnd(pairs.length)];
    if (Math.random() < 0.5) {
      const dist = pairs.filter(p => p[1] !== pr[1]).map(p => p[1]);
      return { prompt: pr[0] + ' en radianes = ?', choices: makeChoices(pr[1], dist), correct: pr[1] };
    }
    const dist = pairs.filter(p => p[0] !== pr[0]).map(p => p[0]);
    return { prompt: pr[1] + ' rad en grados = ?', choices: makeChoices(pr[0], dist), correct: pr[0] };
  }
  if (Math.random() < 0.5) {
    return { prompt: 'Si sin²θ + cos²θ = ?', choices: makeChoices('1', ['0', '2', 'θ', '−1']), correct: '1' };
  }
  return { prompt: 'Halla x si es hipotenusa de 6 y 8', choices: ints(10), correct: '10' };
}

/* ---------- Audio procedural (sin archivos) ---------- */
let AC = null;
function audio() {
  try {
    if (!AC && (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext)) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) { return null; }
}
function beep(freq, dur, type, delay) {
  const ac = audio(); if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    const t = ac.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* sin audio, el juego sigue */ }
}
const sfx = {
  waka() { state.wakaHigh = !state.wakaHigh; beep(state.wakaHigh ? 520 : 380, 0.07, 'square'); },
  ok() { beep(660, 0.09, 'square'); beep(880, 0.09, 'square', 0.09); beep(1320, 0.12, 'square', 0.18); },
  bad() { beep(300, 0.15, 'sawtooth'); beep(150, 0.25, 'sawtooth', 0.12); },
  death() { beep(400, 0.5, 'sawtooth'); beep(60, 0.4, 'sawtooth', 0.2); },
  win() { const n = [523, 659, 784, 1046]; n.forEach((f, i) => beep(f, 0.12, 'square', i * 0.12)); },
  wild() { beep(880, 0.08, 'square'); beep(1174, 0.08, 'square', 0.08); beep(1568, 0.14, 'square', 0.16); }
};

/* ---------- Tablero: puntitos ---------- */
function buildDots() {
  const d = [];
  const blocked = new Set(ANSWER_SLOTS.concat(SPARE_SLOTS).map(s => s.x + ',' + s.y));
  blocked.add(PAC_SPAWN.x + ',' + PAC_SPAWN.y);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (MAP[y][x] === 'X') continue;
    if (blocked.has(x + ',' + y)) continue;
    d.push({ x, y, eaten: false });
  }
  return d;
}
function dotAt(tx, ty) {
  for (const d of state.dots) if (!d.eaten && d.x === tx && d.y === ty) return d;
  return null;
}
/* Casilla más cercana por píxeles: comer por solape, no por llegada exacta.
   (Al salir del centro el juego ya apunta a la casilla siguiente.) */
function nearestTile(e) {
  return {
    x: Math.max(0, Math.min(COLS - 1, Math.round((e.x - TILE / 2) / TILE))),
    y: Math.max(0, Math.min(ROWS - 1, Math.round((e.y - TILE / 2) / TILE)))
  };
}

/* ---------- Preguntas y respuestas en el laberinto ---------- */
function newQuestion() {
  const cfg = LEVELS[state.levelKey];
  const sub = state.levelKey === 0 ? 1 : cfg.sub;
  const q = cfg.gen === 5 ? genQuestion5(sub) : cfg.gen === 4 ? genQuestion4(sub) : cfg.gen === 3 ? genQuestion3(sub) : cfg.gen === 2 ? genQuestion2(sub) : genQuestion(sub);
  state.prompt = q.prompt; state.choices = q.choices; state.correct = q.correct;
  // Nunca pongas una respuesta bajo los pies de Pac: se comería sola
  // y regalaría aciertos (bug: "gano con 1 sola respuesta").
  const here = state.pac ? nearestTile(state.pac).x + ',' + nearestTile(state.pac).y : '';
  const free = ANSWER_SLOTS.concat(SPARE_SLOTS).filter(s => (s.x + ',' + s.y) !== here);
  const slots = shuffle(free).slice(0, 4);
  state.answers = q.choices.map((val, i) => ({ x: slots[i].x, y: slots[i].y, val }));
  syncHud();
}

/* ---------- Entidades ---------- */
function makePac(cfg) {
  return {
    tx: PAC_SPAWN.x, ty: PAC_SPAWN.y,
    x: tileCenter(PAC_SPAWN.x), y: tileCenter(PAC_SPAWN.y),
    dir: { x: 0, y: 0 }, want: { x: -1, y: 0 },
    speed: cfg.pac * TILE
  };
}
function makeGhost(i, cfg) {
  const s = GHOST_SPAWNS[i % GHOST_SPAWNS.length];
  return {
    tx: s.x, ty: s.y, x: tileCenter(s.x), y: tileCenter(s.y),
    dir: { x: 0, y: 0 }, color: GHOST_COLORS[i % GHOST_COLORS.length],
    speed: cfg.pac * TILE * cfg.factor
  };
}
function startGame(levelKey) {
  const cfg = LEVELS[levelKey];
  STATS.plays += 1; saveStats();
  state.levelKey = levelKey;
  state.screen = 'playing';
  state.ok = 0; state.lives = cfg.infinite ? 99 : 3; state.score = 0;
  state.dotsEaten = 0; state.elapsed = 0; state.flash = 0; state.good = 0;
  state.wild = { x: 0, y: 0, active: false, ttl: 0 }; state.wildTimer = WILD_FIRST;
  state.dots = buildDots();
  state.pac = makePac(cfg);
  state.ghosts = [];
  const nG = calmOn() ? 0 : cfg.ghosts;
  for (let i = 0; i < nG; i++) state.ghosts.push(makeGhost(i, cfg));
  newQuestion();
  show(null);
  syncHud();
}
function resetPositions() {
  const cfg = LEVELS[state.levelKey];
  state.pac = makePac(cfg);
  state.ghosts = [];
  const nG = calmOn() ? 0 : cfg.ghosts;
  for (let i = 0; i < nG; i++) state.ghosts.push(makeGhost(i, cfg));
}

/* ---------- Movimiento ---------- */
function freeDirs(tx, ty) {
  const ds = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  return ds.filter(d => isFree(tx + d.x, ty + d.y));
}
function decidePac(e) {
  const w = e.want;
  if ((w.x || w.y) && isFree(e.tx + w.x, e.ty + w.y)) e.dir = { x: w.x, y: w.y };
  else if (!isFree(e.tx + e.dir.x, e.ty + e.dir.y)) e.dir = { x: 0, y: 0 };
}
function decideGhost(e) {
  const cfg = LEVELS[state.levelKey];
  let opts = freeDirs(e.tx, e.ty).filter(d => !(d.x === -e.dir.x && d.y === -e.dir.y));
  if (!opts.length) { e.dir = { x: -e.dir.x, y: -e.dir.y }; return; }
  if (!(e.dir.x || e.dir.y) || Math.random() > 0.35) {
    // en cruces o parado: elige con sesgo de persecución
    if (Math.random() < cfg.chase) {
      let best = opts[0], bd = 1e9;
      for (const d of opts) {
        const m = Math.abs(e.tx + d.x - state.pac.tx) + Math.abs(e.ty + d.y - state.pac.ty);
        if (m < bd) { bd = m; best = d; }
      }
      e.dir = { x: best.x, y: best.y };
    } else {
      const d = opts[rnd(opts.length)];
      e.dir = { x: d.x, y: d.y };
    }
  } else {
    // sigue recto si puede
    if (!isFree(e.tx + e.dir.x, e.ty + e.dir.y)) {
      const d = opts[rnd(opts.length)];
      e.dir = { x: d.x, y: d.y };
    }
  }
}
function moveEntity(e, dt, decide, mult) {
  // giro en U inmediato
  const w = e.want;
  if (w && (w.x || w.y) && (e.dir.x || e.dir.y) && w.x === -e.dir.x && w.y === -e.dir.y) {
    e.dir = { x: w.x, y: w.y };
    e.tx = Math.round((e.x - TILE / 2) / TILE);
    e.ty = Math.round((e.y - TILE / 2) / TILE);
    e.tx = Math.max(0, Math.min(COLS - 1, e.tx));
    e.ty = Math.max(0, Math.min(ROWS - 1, e.ty));
  }
  const step = e.speed * (mult || 1) * dt;
  const cx = tileCenter(e.tx), cy = tileCenter(e.ty);
  if (Math.abs(e.x - cx) <= step && Math.abs(e.y - cy) <= step) {
    e.x = cx; e.y = cy;
    decide(e);
    if (e.dir.x || e.dir.y) {
      const nx = e.tx + e.dir.x, ny = e.ty + e.dir.y;
      if (isFree(nx, ny)) {
        e.tx = nx; e.ty = ny;
        e.x += e.dir.x * step; e.y += e.dir.y * step;
      } else { e.dir = { x: 0, y: 0 }; }
    }
  } else {
    // viaja hacia el centro de su casilla objetivo
    const dx = cx - e.x, dy = cy - e.y;
    const m = Math.hypot(dx, dy) || 1;
    e.x += (dx / m) * Math.min(step, m);
    e.y += (dy / m) * Math.min(step, m);
  }
}

/* ---------- Frenesí: cerca de la meta los fantasmas se ponen nerviosos ----------
   Se activa en el último tramo (redondeo de meta/3: 2 aciertos en meta 5,
   1 en meta 3). Van 30% más rápido y llevan "!" encima. */
const FRENZY_MULT = 1.3;
function frenzyActive() {
  if (state.screen !== 'playing' || !state.ghosts.length) return false;
  const goal = goalNow();
  const remaining = goal - state.ok;
  return state.ok > 0 && remaining > 0 && remaining <= Math.max(1, Math.round(goal / 3));
}
/* ---------- Comodín estrella: quita 2 distractores (efecto 50/50) ----------
   Dura WILD_TTL segundos y parpadea los últimos WILD_BLINK. */
const WILD_FIRST = 8, WILD_RESPAWN = 15, WILD_TTL = 12, WILD_BLINK = 3;
function spawnWild() {
  const taken = new Set(state.answers.map(a => a.x + ',' + a.y));
  const p = nearestTile(state.pac);
  taken.add(p.x + ',' + p.y);
  const opts = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (MAP[y][x] === 'X') continue;
    if (taken.has(x + ',' + y)) continue;
    opts.push({ x, y });
  }
  if (!opts.length) { state.wildTimer = 5; return; }
  const s = opts[rnd(opts.length)];
  state.wild = { x: s.x, y: s.y, active: true, ttl: WILD_TTL };
}
function eatWild() {
  const wrong = shuffle(state.answers.filter(a => a.val !== state.correct));
  const keep = wrong.length ? wrong[0] : null;
  state.answers = state.answers.filter(a => a.val === state.correct || a === keep);
  state.wild.active = false;
  state.wildTimer = WILD_RESPAWN;
  sfx.wild();
}
/* ---------- Reglas de colisión ---------- */
function onGhostHit() {
  const cfg = LEVELS[state.levelKey];
  if (cfg.infinite) {
    state.flash = 0.6;
    sfx.bad();
    resetPositions();
    newQuestion();
    return;
  }
  state.lives -= 1;
  state.flash = 0.8;
  sfx.death();
  syncHud();
  if (state.lives <= 0) {
    state.screen = 'lose';
    gameOver(false);
    show('lose');
  } else {
    resetPositions();
  }
}
function checkAnswer() {
  const p = nearestTile(state.pac);
  for (const a of state.answers) {
    if (a.x === p.x && a.y === p.y) {
      if (a.val === state.correct) {
        state.score += 100; state.ok += 1;
        state.good = 0.5; // destello verde de "bien"
        sfx.ok();
        if (state.ok >= goalNow()) {
          state.screen = 'win';
          sfx.win();
          gameOver(true);
          show('win');
        } else {
          newQuestion();
        }
      } else {
        state.score = Math.max(0, state.score - 20);
        sfx.bad();
        state.flash = 0.6;
        if (!LEVELS[state.levelKey].infinite) {
          state.lives -= 1;
          if (state.lives <= 0) {
            state.screen = 'lose';
            gameOver(false);
            show('lose');
            syncHud();
            return;
          }
          resetPositions();
        }
        newQuestion();
      }
      syncHud();
      return;
    }
  }
}
function update(dt) {
  if (state.screen !== 'playing') return;
  state.elapsed += dt;
  if (state.flash > 0) state.flash -= dt;
  if (state.good > 0) state.good -= dt;
  moveEntity(state.pac, dt, decidePac);
  const nt = nearestTile(state.pac);
  const d = dotAt(nt.x, nt.y);
  if (d) { d.eaten = true; state.dotsEaten += 1; state.score += 10; sfx.waka(); }
  if (!wildOff() && !state.wild.active) {
    state.wildTimer -= dt;
    if (state.wildTimer <= 0) spawnWild();
  } else {
    state.wild.ttl -= dt;
    if (state.wild.ttl <= 0) { // caducó sin comerla: se apaga y vuelve el ciclo
      state.wild.active = false;
      state.wildTimer = WILD_RESPAWN;
    } else if (nt.x === state.wild.x && nt.y === state.wild.y) {
      eatWild();
    }
  }
  checkAnswer();
  if (state.screen !== 'playing') { syncHud(); return; }
  const fz = frenzyActive() ? FRENZY_MULT : 1;
  for (const g of state.ghosts) {
    moveEntity(g, dt, decideGhost, fz);
    const dx = g.x - state.pac.x, dy = g.y - state.pac.y;
    if (Math.hypot(dx, dy) < TILE * 0.6) { onGhostHit(); break; }
  }
  syncHudTime();
}

/* ---------- Récord local ---------- */
function bestKey() { return 'matepacman_best_' + state.levelKey; }
function saveBest() {
  try {
    const k = bestKey();
    const prev = parseInt(localStorage.getItem(k) || '0', 10);
    if (state.score > prev) localStorage.setItem(k, String(state.score));
  } catch (e) { /* modo privado: sin récord */ }
}
function getBest() {
  try { return parseInt(localStorage.getItem(bestKey()) || '0', 10); }
  catch (e) { return 0; }
}

/* ---------- Temas de color por nivel ----------
   Fondo oscuro siempre para que Pac (amarillo) y los fantasmas
   (rojo, rosa, cyan, naranja) se distingan. El muro cambia por nivel.
   gen 1 = Nivel 1, gen 2 = Nivel 2, etc. Nivel 0 = clásico. */
const THEMES = [
  { bg: '#000000', wall: '#2222ee', inner: '#0a0a2e', dot: '#ffd9a0' }, // 0 clásico
  { bg: '#0d0217', wall: '#7b2ff7', inner: '#150826', dot: '#ffd9a0' }, // 1 violeta
  { bg: '#02110f', wall: '#00b3a6', inner: '#04211e', dot: '#ffe9b0' }, // 2 teal
  { bg: '#140702', wall: '#ff6b1a', inner: '#241005', dot: '#ffe9b0' }, // 3 brasa
  { bg: '#021006', wall: '#22cc55', inner: '#041f0c', dot: '#ffe9b0' }, // 4 bosque
  { bg: '#13020d', wall: '#ff2fb3', inner: '#220514', dot: '#ffe9b0' }  // 5 dulce
];
function theme() {
  const cfg = LEVELS[state.levelKey];
  const g = state.levelKey === 0 ? 0 : (cfg ? cfg.gen : 0);
  return THEMES[g] || THEMES[0];
}
/* TODAS las píldoras de respuesta del MISMO color: si la correcta
   brillara distinto, no haría falta calcular nada. */
function pillColor() { return '#ff9de2'; }
/* Texto de la píldora auto-ajustado: en Nivel 5 hay respuestas largas
   (√3/2, π/2, 180°) que no caben a tamaño fijo; se encoge hasta caber. */
function drawPillText(cx, cy, val, c) {
  c = c || ctx;
  c.fillStyle = '#111';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  let size = 13;
  const setF = () => { c.font = 'bold ' + size + 'px monospace'; };
  setF();
  try {
    while (size > 7) {
      const m = c.measureText(val);
      if (!m || !m.width || m.width <= 20) break;
      size -= 1;
      setF();
    }
  } catch (e) { /* canvas mínimo: deja tamaño fijo */ }
  c.fillText(val, cx, cy + 1);
  return size;
}
/* ---------- Render ---------- */
let canvas = null, ctx = null;
function drawWall(x, y) {
  const th = theme();
  const px = x * TILE, py = y * TILE;
  ctx.fillStyle = th.inner;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = th.wall;
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = th.inner;
  ctx.fillRect(px + 7, py + 7, TILE - 14, TILE - 14);
}
function draw() {
  if (!ctx) return;
  const th = theme();
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (MAP[y][x] === 'X') drawWall(x, y);
  }
  // puntitos
  ctx.fillStyle = th.dot;
  for (const d of state.dots || []) {
    if (d.eaten) continue;
    ctx.beginPath();
    ctx.arc(tileCenter(d.x), tileCenter(d.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // respuestas: píldoras grandes con número, TODAS idénticas
  for (const a of state.answers || []) {
    const cx = tileCenter(a.x), cy = tileCenter(a.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = pillColor();
    ctx.fill();
    drawPillText(cx, cy, a.val, ctx);
  }
  // comodín estrella: dorada y pulsante; parpadea cuando va a apagarse
  if (state.wild && state.wild.active &&
      (state.wild.ttl > WILD_BLINK || Math.floor(state.wild.ttl * 4) % 2 === 0)) {
    const cx = tileCenter(state.wild.x), cy = tileCenter(state.wild.y);
    const pr = 10 + 2 * Math.sin(state.elapsed * 6);
    ctx.beginPath();
    ctx.arc(cx, cy, pr, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy + 1);
  }
  // pacman
  if (state.pac) {
    const p = state.pac;
    const t = (state.elapsed * 10) % (Math.PI * 2);
    const mouth = 0.25 + 0.2 * Math.abs(Math.sin(t));
    let ang = 0;
    if (p.dir.x === 1) ang = 0;
    else if (p.dir.x === -1) ang = Math.PI;
    else if (p.dir.y === 1) ang = Math.PI / 2;
    else if (p.dir.y === -1) ang = -Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, 12, ang + mouth, ang + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fillStyle = '#ffe14d';
    ctx.fill();
  }
  // fantasmas
  for (const g of state.ghosts || []) {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y - 2, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(g.x - 11, g.y - 2, 22, 10);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const zx = g.x - 11 + i * 5.5;
      ctx.moveTo(zx, g.y + 8);
      ctx.lineTo(zx + 2.75, g.y + 4);
      ctx.lineTo(zx + 5.5, g.y + 8);
    }
    ctx.fill();
    // ojos
    const ex = g.dir.x * 2, ey = g.dir.y * 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(g.x - 4 + ex, g.y - 4 + ey, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(g.x + 4 + ex, g.y - 4 + ey, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#113';
    ctx.beginPath(); ctx.arc(g.x - 4 + ex * 2, g.y - 4 + ey * 2, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(g.x + 4 + ex * 2, g.y - 4 + ey * 2, 1.7, 0, Math.PI * 2); ctx.fill();
    if (frenzyActive()) {
      ctx.fillStyle = '#ff2222';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', g.x, g.y - 17);
    }
  }
  if (state.flash > 0) {
    ctx.fillStyle = 'rgba(255,40,40,' + Math.min(0.35, state.flash * 0.4) + ')';
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  }
  if (state.good > 0) {
    ctx.fillStyle = 'rgba(40,255,120,' + Math.min(0.30, state.good * 0.5) + ')';
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  }
}

/* ---------- Bucle ---------- */
let lastT = 0;
function frame(t) {
  if (state.screen === 'playing') {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    update(dt);
    draw();
  }
  lastT = t;
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(frame);
}

/* ---------- DOM / HUD ---------- */
function el(id) { return document.getElementById(id); }
function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}
function syncHud() {
  if (typeof document === 'undefined') return;
  el('op').textContent = state.prompt || '—';
  el('hits').textContent = state.ok + '/' + goalNow();
  el('lives').textContent = LEVELS[state.levelKey].infinite ? '∞' : '●'.repeat(Math.max(0, state.lives)) || '—';
  el('score').textContent = state.score;
  el('levelName').textContent = LEVELS[state.levelKey].label + (calmOn() ? ' · tranquilo' : '') + taskTag();
  el('frenzy').style.display = frenzyActive() ? '' : 'none';
  el('best').textContent = getBest();
  syncHudTime();
}
function syncHudTime() {
  if (typeof document === 'undefined') return;
  el('time').textContent = fmtTime(state.elapsed);
}
function show(which) {
  if (typeof document === 'undefined') return;
  const ov = el('overlay');
  if (!which) { ov.style.display = 'none'; return; }
  ov.style.display = 'flex';
  if (which === 'win') {
    el('ovTitle').textContent = '¡Nivel superado!';
    el('ovText').textContent = 'Aciertos ' + state.ok + '/' + goalNow() +
      ' · Puntos ' + state.score + ' · Tiempo ' + fmtTime(state.elapsed) + ' · Récord ' + getBest();
    el('btnResume').style.display = 'none';
    const nx = nextLevelKey();
    if (nx === null) {
      el('btnNext').style.display = 'none';
    } else {
      el('btnNext').style.display = '';
      el('btnNext').textContent = 'Siguiente: ' + LEVELS[nx].label;
    }
  } else if (which === 'lose') {
    el('ovTitle').textContent = 'Sin vidas… ¡inténtalo de nuevo!';
    el('ovText').textContent = 'Te quedaste en ' + state.ok + '/' + goalNow() +
      ' · Puntos ' + state.score + '. Los fantasmas son errores: cada fallo enseña.';
    el('btnResume').style.display = 'none';
    el('btnNext').style.display = 'none';
  } else if (which === 'pause') {
    el('ovTitle').textContent = 'Pausa';
    el('ovText').textContent = LEVELS[state.levelKey].label + ' · ' + state.prompt;
    el('btnResume').style.display = '';
    el('btnNext').style.display = 'none';
  }
  if (which === 'menu') {
    el('ovTitle').textContent = 'Mate Pac-Man';
    el('ovText').textContent = 'Lee la operación de arriba y cómete la píldora con la respuesta correcta. Evita a los fantasmas. La estrella dorada quita dos respuestas falsas pero dura 12 segundos. Cerca de la meta se ponen nerviosos.';
    el('btnResume').style.display = 'none';
    el('btnNext').style.display = 'none';
    el('menuStats').textContent = 'Partidas: ' + STATS.plays + ' · Aciertos totales: ' + STATS.ok;
    refreshGroups();
    syncPlayer();
  }
  const menuOnly = which === 'menu';
  ['hero', 'profile', 'calmRow', 'lvlDesc', 'menuStats', 'taskRow', 'taskMsg', 'sendRow'].forEach(id => {
    el(id).style.display = menuOnly ? '' : 'none';
  });
}
function syncPlayer() {
  if (typeof document === 'undefined') return;
  el('playerLine').textContent = 'Jugador: ' + playerTag();
  el('pname').value = state.player.name || '';
  document.querySelectorAll('#avatars button').forEach(b => {
    b.classList.toggle('sel', b.dataset.av === state.player.avatar);
  });
}
function setWant(x, y) {
  if (state.pac) state.pac.want = { x, y };
}
function init() {
  canvas = el('game');
  canvas.width = COLS * TILE; canvas.height = ROWS * TILE;
  ctx = canvas.getContext('2d');
  // niveles agrupados en acordeón: toca el grupo para desplegar subniveles.
  // En táctil funciona igual que con ratón (solo necesita toques amplios).
  const box = el('levelBtns');
  GROUPS.forEach(g => {
    const gd = document.createElement('div');
    gd.className = 'grp';
    gd.dataset.keys = g.keys.join(',');
    const h = document.createElement('button');
    h.className = 'grpHead';
    const t = document.createElement('span');
    t.textContent = g.title;
    const c = document.createElement('span');
    c.className = 'cnt';
    c.textContent = '0/' + g.keys.length;
    h.appendChild(t);
    h.appendChild(c);
    h.onclick = () => {
      audio();
      const was = gd.classList.contains('open');
      document.querySelectorAll('#levelBtns .grp').forEach(x => x.classList.remove('open'));
      if (!was) gd.classList.add('open');
      refreshGroups();
    };
    const body = document.createElement('div');
    body.className = 'grpBody';
    g.keys.forEach(key => {
      const b = document.createElement('button');
      b.textContent = LEVELS[key].label;
      b.dataset.key = key;
      b.title = LEVELS[key].desc;
      b.className = 'lvl';
      b.onclick = () => { audio(); selectLevel(key); };
      body.appendChild(b);
    });
    gd.appendChild(h);
    gd.appendChild(body);
    box.appendChild(gd);
  });
  // perfil: nombre y avatar matemático
  const abox = el('avatars');
  AVATARS.forEach(a => {
    const b = document.createElement('button');
    b.textContent = a;
    b.dataset.av = a;
    b.title = 'Avatar ' + a;
    b.onclick = () => { state.player.avatar = a; saveProfile(); syncPlayer(); };
    abox.appendChild(b);
  });
  el('pname').onchange = e => {
    state.player.name = (e.target.value || '').trim().slice(0, 16);
    saveProfile(); syncPlayer();
  };
  el('btnStart').onclick = () => { audio(); state.task = null; startGame(state.levelKey); };
  el('btnNext').onclick = () => { audio(); const nx = nextLevelKey(); if (nx !== null) { state.task = null; startGame(nx); } };
  el('btnTask').onclick = () => {
    audio();
    const t = startTask(el('taskCode').value);
    if (t) {
      el('taskMsg').textContent = 'Tarea ' + t.code + ': ' + LEVELS[t.level].label + ', meta ' + t.goal + '. ¡Suerte, ' + playerTag() + '!';
      el('taskMsg').style.color = '#8f8';
    } else {
      el('taskMsg').textContent = 'Código inválido. Formato: nivel-meta, ej. 8-7. Pídelo a tu docente.';
      el('taskMsg').style.color = '#f88';
    }
  };
  el('btnSend').onclick = () => { resendResults(); };
  el('btnResume').onclick = () => { state.screen = 'playing'; show(null); };
  el('btnPause').onclick = () => {
    if (state.screen === 'playing') { state.screen = 'paused'; show('pause'); }
  };
  el('btnMenu').onclick = () => { state.screen = 'menu'; show('menu'); };
  el('chkCalm').onchange = e => { state.calm = !!e.target.checked; syncHud(); };
  // teclado
  document.addEventListener('keydown', e => {
    const k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
    if (k === 'ArrowUp' || k === 'w' || k === 'W') setWant(0, -1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') setWant(0, 1);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') setWant(-1, 0);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') setWant(1, 0);
    else if ((k === 'p' || k === 'P' || k === 'Escape') && state.screen === 'playing') {
      state.screen = 'paused'; show('pause');
    } else if ((k === 'Enter' || k === ' ') && state.screen !== 'playing' && state.screen !== 'paused') {
      audio(); startGame(state.levelKey);
    }
  });
  // swipe táctil
  let sx = 0, sy = 0;
  canvas.addEventListener('touchstart', e => {
    const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.hypot(dx, dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) setWant(dx > 0 ? 1 : -1, 0);
    else setWant(0, dy > 0 ? 1 : -1);
  });
  canvas.oncontextmenu = e => e.preventDefault();
  // cruceta
  document.querySelectorAll('#pad button').forEach(b => {
    const d = b.dataset.dir.split(',').map(Number);
    const h = e => { e.preventDefault(); audio(); setWant(d[0], d[1]); };
    b.addEventListener('touchstart', h, { passive: false });
    b.addEventListener('mousedown', h);
  });
  // El bucle de dibujo SIEMPRE arranca (también con ?jugar=, que vuelve antes)
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
  // Arranque directo por URL: ?nivel=8 preselecciona, ?jugar=8 empieza de una vez
  try {
    if (typeof location !== 'undefined' && location.search) {
      const mj = /[?&]jugar=(\d+)/.exec(location.search);
      if (mj && LEVELS[mj[1]] !== undefined) { audio(); startGame(parseInt(mj[1], 10)); return; }
      const mn = /[?&]nivel=(\d+)/.exec(location.search);
      if (mn && LEVELS[mn[1]] !== undefined) state.levelKey = parseInt(mn[1], 10);
    }
  } catch (e) { /* sin URL, menú normal */ }
  show('menu');
  selectLevel(state.levelKey);
  syncHud();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
if (typeof window !== 'undefined') {
  window.__mate = { state, MAP, LEVELS, LEVEL_ORDER, GROUPS, THEMES, theme, pillColor, drawPillText, nextLevelKey, frenzyActive, spawnWild, moveEntity, parseTask, goalNow, calmOn, wildOff, startTask, resendResults, isFree, genQuestion, genQuestion2, genQuestion3, genQuestion4, genQuestion5, startGame, selectLevel, refreshGroups, update, newQuestion, buildDots, draw, _setCtx(c) { ctx = c; } };
}
