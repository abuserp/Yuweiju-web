const Mods = (function () {
  const STORE_KEY = 'laojiang_mods_v1';
  const packs = [];

  function normLines(arr) {
    return (arr || []).map(l => ({
      who: l.who || '',
      text: l.text || '',
      portrait: l.portrait || null,
      char: l.char || null,
      look: l.look || l.face || null,

      fx: (l.fx === true) ? true : (l.fx || null),

      exit: l.exit || null,
      sfx: l.sfx || null,
      bgm: l.bgm || null,
      bgmStop: !!l.bgmStop,

      loopStart: l.loopStart || null,
      loopStop: l.loopStop || null,

      hold: l.hold || 0,

      noPortrait: !!l.noPortrait,
      color: l.color || null,
      side: l.side === 'right' ? 'right' : 'left',
      choices: (l.choices || []).map(c => ({
        text: c.text || '…',
        affection: c.affection || 0,
        flag: c.flag || null,
        goto: (typeof c.goto === 'number') ? c.goto : null
      }))
    }));
  }

  function normEffects(e) {
    e = e || {};
    return {
      regularWeight: e.regularWeight || {},
      spawnRate: e.spawnRate || 1,
      affection: e.affection || 0,
      unlockDish: e.unlockDish || [],
      flags: e.flags || []
    };
  }

  function normSpecial(g) {
    const a = g.appear || {};
    return {
      id: g.id,
      name: g.name || g.id,
      portrait: g.portrait || null,
      color: g.color || '#b08cc4',
      patience: g.patience || 55,
      pay: g.pay || 1.6,
      crave: g.crave || null,
      party: g.party || 1,
      members: g.members || null,
      colors: g.colors || null,
      sprites: g.sprites || null,
      appear: {
        minDay: a.minDay || 1,
        needAff: a.needAff || 0,
        weight: a.weight || 1,
        cooldown: a.cooldown || 1,
        requires: a.requires || [],
        maxVisits: a.maxVisits || 0,
        force: !!a.force
      },
      effects: normEffects(g.effects),
      stages: (g.stages || []).map((st, i) => ({
        visit: st.visit || (i + 1),
        lines: normLines(st.lines),
        effects: normEffects(st.effects)
      })),

      dish: (function () {
        const st = (g.stages || []).find(x => x && x.effects && (x.effects.unlockDish || []).length);
        return st ? st.effects.unlockDish[0] : null;
      })()
    };
  }

  function normRegular(r) {
    return {
      id: r.id,
      name: r.name || r.id,
      color: r.color || '#8c9bb0',
      weight: r.weight == null ? 1 : r.weight,
      patience: r.patience || 45,
      pay: r.pay || 1,
      cravePool: r.cravePool || null
    };
  }

  function register(raw, source) {
    if (!raw || !raw.id) throw new Error('包里缺 id');
    const pack = {
      id: raw.id,
      name: raw.name || raw.id,
      source: source,
      raw: raw,
      specials: (raw.guests || []).filter(g => g && g.id).map(normSpecial),
      regulars: (raw.regulars || []).filter(r => r && r.id).map(normRegular)
    };
    const i = packs.findIndex(p => p.id === pack.id);
    if (i >= 0) packs.splice(i, 1, pack); else packs.push(pack);
    return pack;
  }

  function list() { return packs; }
  function specials() { return packs.reduce((a, p) => a.concat(p.specials), []); }
  function findSpecial(id) { return specials().find(g => g.id === id) || null; }

  function regulars() {
    const out = GameData.CUSTOMERS.map(normRegular);
    packs.forEach(p => p.regulars.forEach(r => {
      const i = out.findIndex(x => x.id === r.id);
      if (i >= 0) out[i] = r; else out.push(r);
    }));
    return out;
  }

  function visitsOf(id) { const g = State.s.guests[id]; return g ? g.visits : 0; }

  function activeEffects() {
    const out = [];
    specials().forEach(def => {
      const v = visitsOf(def.id);
      if (!v) return;
      out.push(def.effects);
      def.stages.forEach(st => { if (st.visit <= v) out.push(st.effects); });
    });
    return out;
  }

  function regularWeightMult() {
    const m = {};
    activeEffects().forEach(e => {
      Object.keys(e.regularWeight).forEach(k => { m[k] = (m[k] || 1) * e.regularWeight[k]; });
    });
    return m;
  }
  function spawnRateMult() {
    return activeEffects().reduce((a, e) => a * (e.spawnRate || 1), 1);
  }

  function pickRegular() {
    const mult = regularWeightMult();
    const pool = regulars().map(r => ({ r: r, w: Math.max(0, r.weight * (mult[r.id] || 1)) }));
    const total = pool.reduce((s, x) => s + x.w, 0);
    if (total <= 0) return pool[0].r;
    let n = Math.random() * total;
    for (const x of pool) { n -= x.w; if (n <= 0) return x.r; }
    return pool[0].r;
  }

  function eligible(def) {
    const s = State.s;
    const test = GameData.CONFIG.specialEveryDay;
    const rec = s.guests[def.id];
    const v = rec ? rec.visits : 0;
    if (!test && s.day < def.appear.minDay) return false;
    if (s.affection < def.appear.needAff) return false;
    if (def.appear.maxVisits && v >= def.appear.maxVisits) return false;
    if (!test && rec && (s.day - rec.lastDay) < def.appear.cooldown) return false;
    if (def.appear.requires.some(f => !s.flags[f])) return false;
    if (def.stages.length && v >= def.stages.length) return false;
    return true;
  }

  function pickSpecialForToday() {
    const pool = specials().filter(eligible);
    const forced = pool.filter(g => g.appear.force);
    if (forced.length) return forced[0];

    if (GameData.CONFIG.specialEveryDay) {
      if (!pool.length) return null;
      const total0 = pool.reduce((s, g) => s + g.appear.weight, 0);
      let n0 = Math.random() * total0;
      for (const g of pool) { n0 -= g.appear.weight; if (n0 <= 0) return g; }
      return pool[0];
    }

    if (State.s.day <= 1) { State.s.specialPity = false; return null; }
    if (!pool.length) { State.s.specialPity = false; return null; }

    const guaranteed = !!State.s.specialPity;
    if (!guaranteed && Math.random() > GameData.CONFIG.specialChance) {
      State.s.specialPity = true;
      return null;
    }
    State.s.specialPity = false;

    const total = pool.reduce((s, g) => s + g.appear.weight, 0);
    let n = Math.random() * total;
    for (const g of pool) { n -= g.appear.weight; if (n <= 0) return g; }
    return pool[0];
  }

  function stageFor(def) {
    return def.stages[visitsOf(def.id)] || null;
  }
  function storyDone(def) { return visitsOf(def.id) >= def.stages.length; }

  function demandFor(def) {
    if (!def.dish) return null;
    if (visitsOf(def.id) < 2) return null;
    if (State.s.unlocked.indexOf(def.dish) < 0) return null;
    return def.dish;
  }

  function pickReturning() {
    const pool = specials().filter(g => {
      if (!g.stages.length || !storyDone(g)) return false;
      if (g.appear.needAff && State.s.affection < g.appear.needAff) return false;
      return true;
    });
    if (!pool.length) return null;
    if (Math.random() > GameData.CONFIG.returnChance) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function completeVisit(defId, stage) {
    const def = findSpecial(defId);
    if (!def) return;
    const s = State.s;
    const rec = s.guests[def.id] || (s.guests[def.id] = { visits: 0, lastDay: -99 });
    rec.visits += 1;
    rec.lastDay = s.day;
    const list = [def.effects];
    if (stage) list.push(stage.effects);
    list.forEach(e => {
      if (e.affection) State.addAffection(e.affection);
      (e.unlockDish || []).forEach(id => State.grantDish(id, 'event', def.name));
      (e.flags || []).forEach(f => { s.flags[f] = true; });
    });
    State.save();
  }

  function saveUser() {
    try {
      const raws = packs.filter(p => p.source === 'user').map(p => p.raw);
      localStorage.setItem(STORE_KEY, JSON.stringify(raws));
    } catch (e) {}
  }
  function loadUser() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      JSON.parse(raw).forEach(r => { try { register(r, 'user'); } catch (e) {} });
    } catch (e) {}
  }
  function addFromText(text) {
    const raw = JSON.parse(text);
    const pack = register(raw, 'user');
    saveUser();
    return pack;
  }
  function removePack(id) {
    const i = packs.findIndex(p => p.id === id);
    if (i >= 0 && packs[i].source === 'user') { packs.splice(i, 1); saveUser(); return true; }
    return false;
  }

  function tryFetchIndex(done) {
    if (location.protocol.indexOf('http') !== 0 || !window.fetch) { done(); return; }
    fetch('mods/index.json')
      .then(r => r.json())
      .then(files => Promise.all(files.map(f =>
        fetch('mods/' + f).then(r => r.json()).then(j => { try { register(j, 'fetched'); } catch (e) {} }).catch(() => {})
      )))
      .then(() => done(), () => done());
  }

  function init(done) {
    loadUser();
    tryFetchIndex(done || function () {});
  }

  return {
    init, register, list, specials, findSpecial, regulars,
    pickRegular, pickSpecialForToday, pickReturning, stageFor, storyDone, demandFor, completeVisit,
    regularWeightMult, spawnRateMult, visitsOf,
    addFromText, removePack
  };
})();
