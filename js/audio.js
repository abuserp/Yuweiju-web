const Sfx = (function () {
  const DIR = 'audio/';
  const MUTE_KEY = 'yuweiju_mute';

  const SFX = {

    'ui.pick':        { file: 'switch10.ogg', vol: 0.7 },
    'ui.buy':         { file: 'click3.wav', vol: 0.5 },
    'ui.cancel':      { file: 'dong01.wav', vol: 0.5 },
    'ui.talk':        { file: null, vol: 0.4 },
    'ui.pause':       { file: 'pause01.wav', vol: 0.6 },
    'ui.resume':      { file: 'esuap01.wav', vol: 0.6 },

    'kitchen.wok':    { file: 'd_avg_cooksizzle_loop.wav', vol: 0.45, loop: true },
    'kitchen.done':   { file: null, vol: 0.8 },
    'kitchen.jam':    { file: null, vol: 0.6 },

    'plate.pick':     { file: 'getdish.wav', vol: 0.6 },
    'plate.put':      { file: 'd_avg_plateplace.wav', vol: 0.8 },
    'plate.toss':     { file: null, vol: 0.6 },

    'step.jiang':     { file: 'd_avg_walkfast.wav', vol: 0.35 },
    'step.guest':     { file: ['d_avg_walkslow01.wav','d_avg_walkslow02.wav'], vol: 0.15 },

    'guest.enter':    { file: 'opendoor.wav', vol: 0.5 },
    'guest.order':    { file: ['d_avg_typewriter1.wav','d_avg_typewriter2.wav'], vol: 0.5 },
    'guest.eat':      { file: 'eat01.wav', vol: 0.7 },
    'guest.special':  { file: 'specialring.wav', vol: 0.9 },
    'guest.happy':    { file: null, vol: 0.9 },
    'guest.miss':     { file: null, vol: 0.7 },
    'guest.leave':    { file: null, vol: 0.7 },
    'guest.pay':      { file: 'd_avg_coin2.wav', vol: 0.8 },
    'guest.bell':     { file: 'ding01.wav', vol: 0.6 },
    'guest.hungry':   { file: 'd_avg_hungry.wav', vol: 0.5 },

    'takeout.order':  { file: 'cashout.wav', vol: 0.8 },
    'takeout.arrive': { file: 'ding02.wav', vol: 0.9 },

    'combo.up':       { file: null, vol: 0.8 },
    'story.reveal':   { file: 'nevous.wav', vol: 0.9 },
    'story.fight':    { file:'tomshout.wav',vol:0.5},
    'dish.unlock':    { file: null, vol: 1.0 },
    'shop.open':      { file: null, vol: 1.0 },
    'shop.buy':       { file: 'cashin.wav', vol: 0.9 },
    'shop.close':     { file: null, vol: 0.9 }

  };

  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}
  let unlocked = false;
  const pool = {};
  const loops = {};

  function files(id) {
    const e = SFX[id];
    if (!e || !e.file) return null;
    return Array.isArray(e.file) ? e.file : [e.file];
  }
  function make(id, file) {
    if (typeof Audio === 'undefined') return null;
    const a = new Audio(DIR + file);
    a.volume = (SFX[id] && SFX[id].vol) || 1;
    a.preload = 'auto';
    try { a.load(); } catch (e) {}
    return a;
  }

  const POOL_SIZE = 3;

  function ensure(id, file) {
    const key = id + '/' + file;
    let list = pool[key];
    if (list) return list;
    list = pool[key] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const a = make(id, file);
      if (a) list.push(a);
    }
    return list;
  }

  function preload() {
    Object.keys(SFX).forEach(id => {
      const fs = files(id);
      if (fs) fs.forEach(f => ensure(id, f));
    });
  }

  function warm() {
    Object.keys(pool).forEach(key => {
      const a = pool[key][0];
      if (!a) return;
      const v = a.volume;
      try {
        a.muted = true;
        const p = a.play();
        const reset = () => { try { a.pause(); a.currentTime = 0; a.muted = false; a.volume = v; } catch (e) {} };
        if (p && p.then) p.then(reset, reset); else reset();
      } catch (e) { a.muted = false; }
    });
  }

  function play(id) {
    if (muted || !unlocked) return;
    const fs = files(id);
    if (!fs) return;
    const file = fs[Math.floor(Math.random() * fs.length)];
    const list = ensure(id, file);
    if (!list.length) return;

    let a = list.find(x => x.paused || x.ended);
    if (!a) a = list.reduce((m, x) => (x.currentTime > m.currentTime ? x : m), list[0]);
    try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
  }

  function cut(id) {
    Object.keys(pool).forEach(key => {
      if (key.indexOf(id + '/') !== 0) return;
      pool[key].forEach(a => {
        if (!a.paused) { try { a.pause(); a.currentTime = 0; } catch (e) {} }
      });
    });
  }

  function loop(id, on, rate, rewind, vol) {
    const fs = files(id);
    if (!fs) return;
    let a = loops[id];
    if (on) {
      if (muted || !unlocked) return;
      if (!a) { a = make(id, fs[0]); if (!a) return; a.loop = true; loops[id] = a; }
      a.volume = vol != null ? vol : ((SFX[id] && SFX[id].vol) || 1);
      if (rate) { try { a.playbackRate = rate; } catch (e) {} }
      if (a.paused) { try { a.play().catch(() => {}); } catch (e) {} }
    } else if (a && !a.paused) {
      try { a.pause(); if (rewind) a.currentTime = 0; } catch (e) {}
    }
  }

  function loopFor(id, key, on, rate) {
    const fs = files(id);
    if (!fs) return;
    const slot = id + '#' + key;
    let a = loops[slot];
    if (on) {
      if (muted || !unlocked) return;
      if (!a) {
        a = make(id, fs[Math.floor(Math.random() * fs.length)]);
        if (!a) return;
        a.loop = true;
        loops[slot] = a;
        try { a.currentTime = Math.random() * 0.4; } catch (e) {}
      }
      if (rate) { try { a.playbackRate = rate; } catch (e) {} }
      if (a.paused) { try { a.play().catch(() => {}); } catch (e) {} }
    } else if (a && !a.paused) {
      try { a.pause(); } catch (e) {}
    }
  }

  function loopDrop(id, key) {
    const slot = id + '#' + key;
    const a = loops[slot];
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
    delete loops[slot];
  }

  function loopDropAll(id) {
    Object.keys(loops).forEach(slot => {
      if (slot.indexOf(id + '#') === 0) loopDrop(id, slot.slice(id.length + 1));
    });
  }

  function stopAll() { Object.keys(loops).forEach(slot => {
    const a = loops[slot];
    if (a && !a.paused) { try { a.pause(); a.currentTime = 0; } catch (e) {} }
  }); }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    preload();
    warm();
  }

  function mute(on) {
    muted = on == null ? !muted : !!on;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (muted) { stopAll(); if (typeof Bgm !== 'undefined') Bgm.stop(); }
    else if (typeof Bgm !== 'undefined' && Bgm.current()) Bgm.play(Bgm.current());
    return muted;
  }
  function isMuted() { return muted; }

  function todo() {
    return Object.keys(SFX).filter(id => !SFX[id].file);
  }

  return { SFX, play, cut, loop, loopFor, loopDrop, loopDropAll, stopAll, unlock, preload, mute, isMuted, todo };
})();

const Bgm = (function () {
  const DIR = 'audio/';
  const FADE = 0.8;
  const DUCK = 0.25;

  const TRACKS = {
    title: { file: 'm_avg_normal_loop.wav', vol: 0.45 },
    day:   { file: 'd_avg_livelyrestaurant.wav', vol: 0.40 },
    night: { file: 'm_avg_warm_intro.wav', vol: 0.35 },
    adv:   { file: null, vol: 0.35 }
  };

  let cur = null;
  let curVol = 0;
  let el = null;
  let fading = null;
  let ducked = false;

  const DEFAULT_VOL = 0.4;

  function resolve(spec) {
    if (spec && typeof spec === 'object') {
      const base = spec.id ? TRACKS[spec.id] : null;
      return {
        key: spec.id || spec.file,
        file: spec.file || (base && base.file),
        vol: spec.vol != null ? spec.vol : (base ? base.vol : DEFAULT_VOL)
      };
    }
    const t = TRACKS[spec];
    if (t) return { key: spec, file: t.file, vol: t.vol };
    return spec ? { key: spec, file: spec, vol: DEFAULT_VOL } : { key: null, file: null, vol: 0 };
  }

  function targetVol() {
    return curVol * (ducked ? DUCK : 1);
  }

  function make(file) {
    if (!file || typeof Audio === 'undefined') return null;
    const a = new Audio(DIR + file);
    a.loop = true;
    a.volume = 0;
    a.preload = 'auto';
    return a;
  }
  function ramp(a, to, done) {
    if (!a) { if (done) done(); return; }
    const from = a.volume;
    const t0 = Date.now();
    clearInterval(a.__ramp);
    a.__ramp = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / (FADE * 1000));
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) { clearInterval(a.__ramp); if (done) done(); }
    }, 40);
  }

  function play(spec) {
    const r = resolve(spec);
    if (Sfx.isMuted()) { cur = r.key; curVol = r.vol; return; }
    if (r.key === cur && el && !el.paused) return;
    const next = make(r.file);
    cur = r.key;
    curVol = r.vol;
    if (fading) { try { fading.pause(); } catch (e) {} fading = null; }
    if (el) {
      fading = el;
      ramp(fading, 0, () => { try { fading.pause(); } catch (e) {} fading = null; });
    }
    el = next;
    if (!el) return;
    try { el.play().catch(() => {}); } catch (e) {}
    ramp(el, targetVol());
  }

  function duck(on) {
    ducked = !!on;
    if (el && cur) ramp(el, targetVol());
  }

  function stop() {
    cur = null;
    if (el) { const a = el; el = null; ramp(a, 0, () => { try { a.pause(); } catch (e) {} }); }
  }
  function current() { return cur; }
  function todo() { return Object.keys(TRACKS).filter(id => !TRACKS[id].file); }

  return { TRACKS, play, stop, duck, current, todo };
})();
