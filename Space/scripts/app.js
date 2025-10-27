// App shell and modular puzzle hub

const CONFIG = {
  quotes: [
    "Between stimulus and response there is a space. — Viktor Frankl",
    "We suffer more in imagination than in reality. — Seneca",
    "There is a crack in everything; that's how the light gets in. — Leonard Cohen",
    "Every perception is to some degree creation. — Anil Seth",
    "Things are not as they are, but as we are. — Anaïs Nin",
    "The quieter you become, the more you can hear. — Ram Dass",
    "Attention is the beginning of devotion. — Mary Oliver",
    "All models are wrong, but some are useful. — George Box",
    "What you seek is seeking you. — Rumi",
    "He who has a why to live can bear almost any how. — Nietzsche",
    "Mystery is not the absence of meaning, but the presence of more meaning than we can comprehend. — Eugene Peterson",
  ],
};

const Registry = {
  games: [],
  byId: new Map(),
};

let Current = { api: null };

async function loadManifest() {
  const res = await fetch("games/manifest.json");
  const list = await res.json();
  // Load modules in parallel
  const modules = await Promise.all(
    list.map(async (g) => {
      const mod = await import(`../${g.path}`);
      return { ...g, mount: mod.default };
    }),
  );
  Registry.games = modules;
  Registry.byId.clear();
  for (const g of modules) Registry.byId.set(g.id, g);
}

let MANIFEST_READY = false;
let _manifestPromise = null;
function ensureManifest() {
  if (MANIFEST_READY && Registry.games.length) return Promise.resolve();
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = (async () => {
    await loadManifest();
    MANIFEST_READY = true;
  })();
  return _manifestPromise;
}

// Starfield with independent twinkle, respawn, and constellations
function starfield() {
  const c = document.getElementById("stars"),
    ctx = c.getContext("2d");
  let w = 0,
    h = 0,
    stars = [],
    rafId = 0,
    last = 0,
    skipEvery = 0,
    framesUnder40 = 0,
    hiddenSnoozeMs = 500,
    lastDraw = 0,
    constellations = [],
    lastConst = 0;
  function resize() {
    w = c.width = innerWidth;
    h = c.height = innerHeight;
    const density = Math.max(50, Math.floor((w * h) / 12000));
    stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.6 + 0.4,
      p: Math.random() * Math.PI * 2,
      s: 0.6 + Math.random() * 1.2,
      a: 0.6 + Math.random() * 0.8,
      cool: 0,
    }));
  }
  function spawnConstellation(t) {
    const n = 5 + Math.floor(Math.random() * 3);
    const pad = Math.min(w, h) * 0.08;
    const cx = pad + Math.random() * (w - pad * 2);
    const cy = pad + Math.random() * (h - pad * 2);
    const rad = Math.min(w, h) * (0.08 + Math.random() * 0.12);
    const nodes = Array.from({ length: n }, () => {
      const ang = Math.random() * Math.PI * 2;
      const r = rad * (0.3 + Math.random() * 0.7);
      return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    });
    const used = new Set([0]);
    const edges = [];
    let i = 0;
    while (used.size < n) {
      let best = -1,
        bestD = 1e9;
      for (let j = 0; j < n; j++)
        if (!used.has(j)) {
          const dx = nodes[i].x - nodes[j].x,
            dy = nodes[i].y - nodes[j].y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = j;
          }
        }
      edges.push([i, best]);
      used.add(best);
      i = best;
    }
    constellations.push({ nodes, edges, born: t, life: 12000, fade: 800 });
  }
  function draw(t) {
    if (document.visibilityState === "hidden") {
      if (t - lastDraw < hiddenSnoozeMs) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastDraw = t;
    }
    if (last) {
      const dt = t - last;
      const fps = 1000 / Math.max(1, dt);
      if (fps < 40) framesUnder40++;
      else framesUnder40 = Math.max(0, framesUnder40 - 1);
      skipEvery = framesUnder40 > 20 ? 1 : 0;
    }
    last = t;
    if (skipEvery && Math.floor(t / 16) % 2 === 0) {
      rafId = requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    if (t - lastConst > 9000 && Math.random() < 0.02) {
      spawnConstellation(t);
      lastConst = t;
    }
    for (const s of stars) {
      if (s.cool > 0) {
        s.cool--;
        continue;
      }
      const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p);
      if (tw < 0.03) {
        s.cool = 20 + Math.floor(Math.random() * 90);
        s.x = Math.random() * w;
        s.y = Math.random() * h;
        s.p = Math.random() * Math.PI * 2;
        s.s = 0.6 + Math.random() * 1.2;
        s.a = 0.6 + Math.random() * 0.8;
        continue;
      }
      const alpha = s.z * tw * s.a;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    for (let k = constellations.length - 1; k >= 0; k--) {
      const cst = constellations[k];
      const age = t - cst.born;
      if (age > cst.life + cst.fade) {
        constellations.splice(k, 1);
        continue;
      }
      let a = 1;
      if (age < cst.fade) a = age / cst.fade;
      else if (age > cst.life) a = 1 - Math.min(1, (age - cst.life) / cst.fade);
      ctx.globalAlpha = 0.12 * a;
      ctx.strokeStyle = "#c7c6ff";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (const [i1, i2] of cst.edges) {
        const p1 = cst.nodes[i1],
          p2 = cst.nodes[i2];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      for (const n of cst.nodes) {
        ctx.globalAlpha = 0.25 * a;
        ctx.fillStyle = "#eaeaff";
        ctx.fillRect(n.x, n.y, 1.2, 1.2);
      }
    }
    rafId = requestAnimationFrame(draw);
  }
  function start() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(draw);
  }
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
  });
  resize();
  start();
}

// Stage
const Stage = {
  _cleanup: null,
  _current: null, // {title, mount}
  mount(title, mountFn) {
    this._cleanup && this._cleanup();
    this._cleanup = null;
    this._current = { title, mount: mountFn };
    document.getElementById("gameTitle").textContent = title;
    const host = document.getElementById("gameHost");
    host.classList.add("fade");
    host.classList.remove("show");
    host.innerHTML = "";
    const api = createGameAPI();
    Current.api = api;
    const result = (mountFn || ((h) => (h.textContent = "Loader missing")))(
      host,
      api,
    );
    if (result && typeof result === "object") {
      this._cleanup = result.cleanup || null;
    }
    requestAnimationFrame(() => host.classList.add("show"));
  },
  remount() {
    if (this._current) {
      this.mount(this._current.title, this._current.mount);
    }
  },
  unmount() {
    const host = document.getElementById("gameHost");
    host.classList.remove("show");
    const finalize = () => {
      this._cleanup && this._cleanup();
      this._cleanup = null;
      this._current = null;
      /* leave host empty; next route mounts content */ host.innerHTML = "";
      host.removeEventListener("transitionend", finalize);
    };
    host.addEventListener("transitionend", finalize, { once: true });
    setTimeout(finalize, 240);
  },
};

// Ambient audio (subtle hum)
// Audio engine: separate hum and generative beats
const audio = {
  ctx: null,
  master: null,
  beats: {
    gain: null,
    on: false,
    tempo: 72,
    step: 0,
    nextTime: 0,
    timer: null,
    bar: 0,
    drum: null,
    hat: null,
    bass: null,
    pad: null,
    perc: null,
    bed: null,
    drop: 0,
  },
};

function initAudio() {
  if (audio.ctx) return;
  audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.9; // overall headroom
  audio.master.connect(audio.ctx.destination);
  audio.beats.gain = audio.ctx.createGain();
  audio.beats.gain.gain.value = 0.0;
  audio.beats.gain.connect(audio.master);
}

// Generative lofi beats (kick/snare/hat + pads + bass), layers fade in/out
async function toggleBeats() {
  await ensureAudio();
  if (audio.beats.on) {
    stopBeats();
  } else {
    startBeats();
  }
}
function startBeats() {
  initAudio();
  const ctx = audio.ctx;
  audio.beats.on = true;
  audio.beats.step = 0;
  audio.beats.bar = 0;
  audio.beats.drop = 0;
  audio.beats.nextTime = ctx.currentTime + 0.05;
  ensureBeatLayers();
  startBed();
  // initial layer levels
  setGain(audio.beats.drum, 0.95);
  setGain(audio.beats.hat, 0.6);
  setGain(audio.beats.bass, 0.85);
  setGain(audio.beats.pad, 0.5);
  setGain(audio.beats.perc, 0.0);
  fadeTo(audio.beats.gain, 0.28, 0.25);
  if (audio.beats.timer) clearInterval(audio.beats.timer);
  audio.beats.timer = setInterval(scheduleAhead, 25);
}
function stopBeats() {
  if (!audio.ctx) return;
  audio.beats.on = false;
  fadeTo(audio.beats.gain, 0.0, 0.2);
  if (audio.beats.timer) {
    clearInterval(audio.beats.timer);
    audio.beats.timer = null;
  }
}
function scheduleAhead() {
  const ctx = audio.ctx;
  const look = 0.15;
  const spb = 60 / audio.beats.tempo;
  const sp16 = spb / 4;
  while (audio.beats.nextTime < ctx.currentTime + look) {
    const t = audio.beats.nextTime;
    const s = audio.beats.step % 16; // 16th grid
    // bar management
    if (s === 0) {
      audio.beats.bar++; // occasional layer morphs and brief drops
      if (audio.beats.bar % 4 === 0) {
        maybeToggleLayer("pad", 0.5, 0.08);
      }
      if (audio.beats.bar % 6 === 0) {
        maybeToggleLayer("perc", 0.22, 0.0);
      }
      if (audio.beats.bar % 8 === 0) {
        maybeToggleLayer("hat", 0.55, 0.25);
      }
      if (audio.beats.drop <= 0 && Math.random() < 0.25) {
        audio.beats.drop = 1;
      } else if (audio.beats.drop > 0) {
        audio.beats.drop--;
      }
    }
    // drums
    if (audio.beats.drop === 0) {
      if (s === 0 && Math.random() < 0.9) kick(t); // downbeat mostly on
      if (s === 8 && Math.random() < 0.8) kick(t + 0.001);
      if ((s === 4 || s === 12) && Math.random() < 0.85)
        snare(t, Math.random() < 0.85 ? 1.0 : 0.6);
    }
    // hihat pattern mostly on 8ths, not constant
    if (s % 2 === 0 && Math.random() < 0.6) hihat(t, s % 4 === 0 ? 0.12 : 0.08);
    // bass on 0 and 8, slight alt note
    if (s === 0 || s === 8)
      bass(t, s === 0 ? 55 : Math.random() < 0.5 ? 41 : 49);
    // pad gently at bar start
    if (s === 0) padChord(t);
    // perc claves on some offbeats
    if ([2, 6, 10, 14].includes(s) && Math.random() < 0.4) perc(t);
    audio.beats.nextTime += sp16;
    audio.beats.step++;
  }
}
function envGain(at, g, a = 0.001, d = 0.12) {
  g.gain.setValueAtTime(0.0, at);
  g.gain.linearRampToValueAtTime(1.0, at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + d);
}
function kick(at) {
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  o.type = "sine";
  const g = ctx.createGain();
  g.gain.value = 0;
  o.connect(g).connect(audio.beats.drum);
  o.frequency.setValueAtTime(120, at);
  o.frequency.exponentialRampToValueAtTime(40, at + 0.12);
  envGain(at, g, 0.001, 0.12);
  o.start(at);
  o.stop(at + 0.2);
}
function snare(at, vel = 1.0) {
  const ctx = audio.ctx;
  const n = ctx.createBufferSource();
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    ch[i] = (Math.random() * 2 - 1) * 0.6;
  }
  n.buffer = b;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.value = 0;
  n.connect(hp).connect(g).connect(audio.beats.drum);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.4 * vel, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  n.start(at);
  n.stop(at + 0.22);
}
function hihat(at, amp = 0.1) {
  const ctx = audio.ctx;
  const n = ctx.createBufferSource();
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    ch[i] = Math.random() * 2 - 1;
  }
  n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 8000;
  bp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = 0;
  n.connect(bp).connect(g).connect(audio.beats.hat);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(amp, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  n.start(at);
  n.stop(at + 0.08);
}
function bass(at, f = 55) {
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  o.type = "sine";
  const g = ctx.createGain();
  g.gain.value = 0;
  o.frequency.value = f;
  o.connect(g).connect(audio.beats.bass);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.18, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
  o.start(at);
  o.stop(at + 0.5);
}
let chordFlip = false;
function padChord(at) {
  const ctx = audio.ctx;
  chordFlip = !chordFlip;
  const base = chordFlip ? 110 : 98;
  const tri = [base, base * 1.25, base * 1.5];
  tri.forEach((f, idx) => {
    const o = ctx.createOscillator();
    o.type = idx % 2 ? "triangle" : "sine";
    const g = ctx.createGain();
    g.gain.value = 0;
    o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
    o.connect(g).connect(audio.beats.pad);
    o.start(at);
    g.gain.linearRampToValueAtTime(0.06, at + 0.4);
    g.gain.linearRampToValueAtTime(0.02, at + 3.0);
    g.gain.linearRampToValueAtTime(0.0, at + 4.0);
    o.stop(at + 4.1);
  });
}
function perc(at) {
  const ctx = audio.ctx;
  const n = ctx.createBufferSource();
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    ch[i] = (Math.random() * 2 - 1) * 0.6;
  }
  n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2000;
  bp.Q.value = 1.0;
  const g = ctx.createGain();
  g.gain.value = 0;
  n.connect(bp).connect(g).connect(audio.beats.perc);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.2, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  n.start(at);
  n.stop(at + 0.09);
}

function ensureBeatLayers() {
  const ctx = audio.ctx;
  if (!audio.beats.drum) {
    audio.beats.drum = ctx.createGain();
    audio.beats.drum.gain.value = 0.0;
    audio.beats.drum.connect(audio.beats.gain);
  }
  if (!audio.beats.hat) {
    audio.beats.hat = ctx.createGain();
    audio.beats.hat.gain.value = 0.0;
    audio.beats.hat.connect(audio.beats.gain);
  }
  if (!audio.beats.bass) {
    audio.beats.bass = ctx.createGain();
    audio.beats.bass.gain.value = 0.0;
    audio.beats.bass.connect(audio.beats.gain);
  }
  if (!audio.beats.pad) {
    audio.beats.pad = ctx.createGain();
    audio.beats.pad.gain.value = 0.0;
    audio.beats.pad.connect(audio.beats.gain);
  }
  if (!audio.beats.perc) {
    audio.beats.perc = ctx.createGain();
    audio.beats.perc.gain.value = 0.0;
    audio.beats.perc.connect(audio.beats.gain);
  }
}
function startBed() {
  const ctx = audio.ctx;
  if (audio.beats.bed) return;
  const bed = ctx.createGain();
  bed.gain.value = 0.0;
  bed.connect(audio.beats.gain);
  // lowpassed noise bed
  const n = ctx.createBufferSource();
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    ch[i] = (Math.random() * 2 - 1) * 0.02;
  }
  n.buffer = b;
  const nf = ctx.createBiquadFilter();
  nf.type = "lowpass";
  nf.frequency.value = 1200;
  n.loop = true;
  n.connect(nf).connect(bed);
  n.start();
  // two very soft sines
  const o1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  o1.type = "sine";
  o1.frequency.value = 55;
  g1.gain.value = 0.01;
  o1.connect(g1).connect(bed);
  o1.start();
  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = "sine";
  o2.frequency.value = 110;
  g2.gain.value = 0.008;
  o2.connect(g2).connect(bed);
  o2.start();
  audio.beats.bed = { bed, n, o1, o2 };
  fadeTo(bed, 0.12, 0.6);
}
function maybeToggleLayer(name, onVal, offVal) {
  const node = audio.beats[name];
  if (!node) return;
  const current = node.gain.value;
  const target = current < onVal * 0.5 ? onVal : offVal;
  fadeTo(node, target, 1.2);
}
function setGain(node, v) {
  if (!node) return;
  node.gain.setValueAtTime(v, audio.ctx.currentTime);
}

function fadeTo(node, value, t = 0.2) {
  const ctx = audio.ctx;
  node.gain.cancelScheduledValues(ctx.currentTime);
  node.gain.linearRampToValueAtTime(value, ctx.currentTime + t);
}
async function ensureAudio() {
  if (!audio.ctx) {
    initAudio();
  }
  try {
    await audio.ctx.resume();
  } catch {}
}

function createGameAPI() {
  return {
    setSubtitle(text) {
      /* reserved */
    },
    recordScore(gameId, entry) {
      try {
        const key = "atelier.scores";
        const cur = JSON.parse(localStorage.getItem(key) || "{}");
        const g = cur[gameId] || {}; // keep best by keys present
        Object.keys(entry || {}).forEach((k) => {
          const v = entry[k];
          if (typeof v === "number") {
            if (!(k in g) || v > g[k]) g[k] = v;
          } else {
            g[k] = v;
          }
        });
        cur[gameId] = g;
        localStorage.setItem(key, JSON.stringify(cur));
      } catch {}
    },
    getScores() {
      try {
        return JSON.parse(localStorage.getItem("atelier.scores") || "{}");
      } catch {
        return {};
      }
    },
    sfx: {
      click() {
        /* optional */
      },
    },
  };
}

function mountProgress(host) {
  const scores = new (class {
    get() {
      try {
        return JSON.parse(localStorage.getItem("atelier.scores") || "{}");
      } catch {
        return {};
      }
    }
  })().get();
  host.style.padding = "var(--space)";
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "12px";
  wrap.style.maxWidth = "720px";
  wrap.style.margin = "0 auto";
  host.appendChild(wrap);
  const title = document.createElement("div");
  title.textContent = "Your Progress";
  wrap.appendChild(title);
  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "8px";
  wrap.appendChild(list);
  const items = Object.entries(scores);
  if (items.length === 0) {
    const p = document.createElement("div");
    p.style.color = "var(--muted)";
    p.textContent = "No records yet. Play any game to begin.";
    list.appendChild(p);
  }
  items.forEach(([gid, obj]) => {
    const g = Registry.byId.get(gid) || { name: gid };
    const row = document.createElement("div");
    row.className = "tile";
    row.innerHTML = `<h3>${g.name}</h3><p>${Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join("  •  ")}</p>`;
    list.appendChild(row);
  });
}

// UI and routing

const ROUTE = { current: "#home", stack: ["#home"] };
function show(v) {
  document.getElementById("home").hidden = v !== "home";
  document.getElementById("game").hidden = v !== "game";
  document.getElementById("homeBtn").hidden = v === "home";
  if (v === "game") {
    document.getElementById("gameHost").classList.add("fade");
  }
}
function exitGame() {
  const host = document.getElementById("gameHost");
  host.classList.remove("show");
  const finish = () => {
    Stage.unmount();
    // pop current and go to previous on our own stack
    if (ROUTE.stack.length > 1) ROUTE.stack.pop();
    const target = ROUTE.stack[ROUTE.stack.length - 1] || "#home";
    const prevHash = location.hash;
    location.hash = target;
    // If hash didn't change (some browsers suppress), force handle
    if (prevHash === target) {
      setTimeout(handleHash, 0);
    }
    host.removeEventListener("transitionend", finish);
  };
  host.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 220);
}

function goHome() {
  const host = document.getElementById("gameHost");
  host.classList.remove("show");
  const finish = () => {
    Stage.unmount();
    location.hash = "#home";
    host.removeEventListener("transitionend", finish);
  };
  host.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 200);
}

function handleHash() {
  const hash = location.hash || "#home";
  // track route using a simple stack
  if (hash !== ROUTE.current) {
    ROUTE.current = hash;
    const top = ROUTE.stack[ROUTE.stack.length - 1];
    if (top !== hash) {
      ROUTE.stack.push(hash);
      if (ROUTE.stack.length > 50) ROUTE.stack.shift();
    }
  }
  if (hash === "#home") {
    show("home");
    return;
  }
  if (hash === "#game/hub") {
    return ensureManifest().then(() => {
      show("game");
      Stage.mount("Games & Riddles", mountHub);
    });
  }
  if (hash === "#game/progress") {
    return ensureManifest().then(() => {
      show("game");
      Stage.mount("My Progress", mountProgress);
    });
  }
  if (hash.startsWith("#game/")) {
    const id = hash.split("/")[1];
    return ensureManifest().then(() => {
      const g = Registry.byId.get(id);
      if (g) {
        show("game");
        Stage.mount(g.name, g.mount);
      } else {
        location.hash = "#game/hub";
      }
    });
  }
  // not found -> hub
  location.hash = "#game/hub";
}

function renderDoors() {
  const grid = document.getElementById("doors");
  grid.innerHTML = "";
  const el = document.createElement("div");
  el.className = "door";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.innerHTML = `<h3>Games & Riddles</h3><p>Enter the atelier</p>`;
  const open = () => {
    location.hash = "#game/hub";
  };
  el.addEventListener("click", open);
  el.addEventListener("pointerup", open);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  grid.appendChild(el);
}

function mountHub(host) {
  host.style.display = "grid";
  host.style.gap = "12px";
  host.style.padding = "var(--space)";
  host.innerHTML = `<div class="wrap" style="width:min(1000px,92vw);"><div class="doors" id="hubDoors"></div></div>`;
  const grid = host.querySelector("#hubDoors");
  // Progress tile
  const prog = document.createElement("div");
  prog.className = "door";
  prog.setAttribute("role", "button");
  prog.setAttribute("tabindex", "0");
  prog.innerHTML = `<h3>My Progress</h3><p>Personal bests on this device</p>`;
  const openProg = () => {
    location.hash = "#game/progress";
  };
  prog.addEventListener("click", openProg);
  prog.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProg();
    }
  });
  grid.appendChild(prog);
  Registry.games.forEach((g) => {
    const d = document.createElement("div");
    d.className = "door";
    d.setAttribute("role", "button");
    d.setAttribute("tabindex", "0");
    d.innerHTML = `<h3>${g.name}</h3><p>${g.blurb || ""}</p>`;
    const open = () => {
      location.hash = `#game/${g.id}`;
    };
    d.addEventListener("click", open);
    d.addEventListener("pointerup", open);
    d.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    grid.appendChild(d);
  });
}

function clock() {
  const el = document.getElementById("clock");
  function tick() {
    const d = new Date();
    el.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  tick();
  setInterval(tick, 15000);
}
function rotateQuotes() {
  const el = document.getElementById("quote");
  let i = Math.floor(Math.random() * CONFIG.quotes.length);
  el.textContent = CONFIG.quotes[i];
  setInterval(() => {
    i = (i + 1) % CONFIG.quotes.length;
    el.textContent = CONFIG.quotes[i];
  }, 16000);
}

function bootButtons() {
  document.getElementById("homeBtn").addEventListener("click", goHome);
  const backFloating = document.getElementById("backFloating");
  if (backFloating) backFloating.addEventListener("click", exitGame);
  const beats = document.getElementById("beatsToggle");
  beats.addEventListener("click", async () => {
    await ensureAudio();
    if (audio.beats.on) {
      stopBeats();
      beats.textContent = "Play";
      beats.setAttribute("aria-pressed", "false");
    } else {
      startBeats();
      beats.textContent = "Pause";
      beats.setAttribute("aria-pressed", "true");
    }
  });
}

async function boot() {
  starfield();
  clock();
  rotateQuotes();
  bootButtons();
  await ensureManifest();
  renderDoors();
  addEventListener("hashchange", handleHash);
  handleHash();
}
document.addEventListener("DOMContentLoaded", boot);

// Moon phase drawing on canvas
function drawMoonSigil() {
  const c = document.getElementById("moonSigil");
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width,
    h = c.height;
  const r = Math.min(w, h) * 0.45;
  const cx = w / 2,
    cy = h / 2;
  ctx.clearRect(0, 0, w, h);
  // compute phase (0 new .. 1 full .. 2 new) then wrap to [0,1]
  const now = new Date();
  const phase = lunarPhase(now); // 0..1 new..full..new
  // base moon
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#bfc2cf";
  ctx.fill();
  // shading using overlapping arc method
  const cosPhi = Math.cos(phase * 2 * Math.PI);
  const dir = cosPhi >= 0 ? 1 : -1;
  const ex = Math.abs(cosPhi) * r;
  ctx.fillStyle = "#0f0f16";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(cx + dir * 0, cy, ex, r, 0, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fill();
  // subtle craters
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#9fa3b3";
  [
    [-0.3, -0.2, 0.11],
    [0.25, -0.25, 0.08],
    [0.15, 0.22, 0.12],
  ].forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
function lunarPhase(d) {
  // simplified synodic approximation
  const synodic = 29.53058867;
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const days = (d - ref) / 86400000;
  let p = (days % synodic) / synodic;
  if (p < 0) p += 1;
  return p;
}
window.addEventListener("load", drawMoonSigil);
