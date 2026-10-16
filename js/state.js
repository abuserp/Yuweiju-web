const State = (function () {
  const C = GameData.CONFIG;
  const SAVE_KEY = 'yuweiju_v3';

  const s = {
    day: 1,
    money: 0,
    affection: 0,
    stock: {},
    menu: [],
    history: [],
    guests: {},
    flags: {},
    unlocked: [],
    cooked: {},
    slots: 5,
    stapleUsed: {},
    spoiled: [],
    newDishes: [],
    specialPity: false
  };

  function reset() {
    s.day = 1;
    s.money = C.startMoney;
    s.affection = 0;
    s.stock = {};
    GameData.STOCK_KEYS.forEach(k => { s.stock[k] = [{ n: C.startIngredients[k] || 0, day: 1 }]; });
    s.menu = C.startMenu.slice();
    s.history = [];
    s.guests = {};
    s.flags = {};
    s.unlocked = [];
    s.cooked = {};
    s.slots = GameData.SLOTS.filter(e => !e.price).length;
    s.stapleUsed = {};
    s.spoiled = [];
    s.newDishes = [];
    s.specialPity = false;
  }

  function affLevel() {
    let lv = GameData.AFFECTION[0], idx = 0;
    GameData.AFFECTION.forEach((a, i) => { if (s.affection >= a.at) { lv = a; idx = i; } });
    return { level: lv, index: idx, next: GameData.AFFECTION[idx + 1] || null };
  }
  function cookSpeed() { return affLevel().level.cookSpeed; }
  function menuSlots() { return s.slots; }

  function nextSlot() {
    const i = s.slots;
    const e = GameData.SLOTS[i];
    if (!e) return null;
    return {
      index: i + 1,
      need: e.need,
      price: e.price,
      affOk: s.affection >= e.need,
      moneyOk: s.money >= e.price
    };
  }
  function buySlot() {
    const nx = nextSlot();
    if (!nx || !nx.affOk || !nx.moneyOk) return false;
    s.money -= nx.price;
    s.slots += 1;
    return true;
  }
  function addAffection(n) { s.affection = Math.max(0, s.affection + n); }

  function isUnlocked(d) {
    if (s.unlocked.indexOf(d.id) >= 0) return true;
    const u = d.unlock;
    if (u.type === 'start') return true;
    if (u.type === 'aff') return s.affection >= u.at;
    return false;
  }
  function unlockedDishes() { return GameData.DISHES.filter(isUnlocked); }

  function availableAttrs() {
    const out = [];
    unlockedDishes().forEach(d => d.attrs.forEach(a => { if (out.indexOf(a) < 0) out.push(a); }));
    return out;
  }

  function masteryProgress(d) {
    if (d.unlock.type !== 'mastery') return null;
    return { have: s.cooked[d.unlock.from] || 0, need: d.unlock.need };
  }

  function recordCooked(dishId) {
    s.cooked[dishId] = (s.cooked[dishId] || 0) + 1;
    const got = [];
    GameData.DISHES.forEach(d => {
      if (d.unlock.type !== 'mastery') return;
      if (s.unlocked.indexOf(d.id) >= 0) return;
      if (d.unlock.from !== dishId) return;
      if ((s.cooked[dishId] || 0) >= d.unlock.need) {
        s.unlocked.push(d.id);
        s.newDishes.push({ id: d.id, why: 'mastery', from: dishId });
        got.push(d.id);
      }
    });
    return got;
  }
  function grantDish(id, why, who) {
    if (!GameData.dish(id)) return false;
    if (s.unlocked.indexOf(id) >= 0) return false;
    s.unlocked.push(id);
    s.newDishes.push({ id: id, why: why || 'event', who: who || '' });
    return true;
  }

  function batches(k) { return s.stock[k] || (s.stock[k] = []); }
  function count(k) { return batches(k).reduce((a, b) => a + b.n, 0); }
  function addIng(k, n) {
    const list = batches(k);
    const same = list.find(b => b.day === s.day);
    if (same) same.n += n; else list.push({ n: n, day: s.day });
  }
  function takeIng(k, n) {
    const list = batches(k);
    let left = n;
    while (left > 0 && list.length) {
      const b = list[0];
      const use = Math.min(b.n, left);
      b.n -= use; left -= use;
      if (b.n <= 0) list.shift();
    }
  }
  function hasIngredients(cost) {
    return Object.keys(cost).every(k => GameData.ING[k].staple || count(k) >= cost[k]);
  }
  function consumeIngredients(cost) {
    Object.keys(cost).forEach(k => {
      if (GameData.ING[k].staple) s.stapleUsed[k] = (s.stapleUsed[k] || 0) + cost[k];
      else takeIng(k, cost[k]);
    });
  }

  function stapleBill() {
    let total = 0;
    const items = [];
    GameData.STAPLE_KEYS.forEach(k => {
      const n = s.stapleUsed[k] || 0;
      if (!n) return;
      const cost = n * GameData.ING[k].price;
      total += cost;
      items.push({ id: k, n: n, cost: cost });
    });
    return { total: total, items: items };
  }
  function clearStaples() { s.stapleUsed = {}; }

  function sellPrice(k) { return Math.floor(GameData.ING[k].price * C.sellRate); }
  function buy(k, n) {
    if (GameData.ING[k].staple) return false;
    if (n > 0) {
      const price = GameData.ING[k].price * n;
      if (s.money < price) return false;
      s.money -= price;
      addIng(k, n);
      return true;
    }
    if (count(k) < -n) return false;
    s.money += sellPrice(k) * (-n);
    takeIng(k, -n);
    return true;
  }

  function spoil() {
    const out = [];
    if (!C.spoilage) { s.spoiled = out; return out; }
    GameData.STOCK_KEYS.forEach(k => {
      const shelf = GameData.ING[k].shelf;
      if (!shelf) return;
      const list = batches(k);
      let lost = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (s.day - list[i].day >= shelf) { lost += list[i].n; list.splice(i, 1); }
      }
      if (lost) out.push({ id: k, n: lost });
    });
    s.spoiled = out;
    return out;
  }

  function expiringToday(k) {
    const shelf = GameData.ING[k].shelf;
    if (!shelf || !C.spoilage) return 0;
    return batches(k).reduce((a, b) => a + ((s.day + 1) - b.day >= shelf ? b.n : 0), 0);
  }

  function orderTakeout(d) {
    const price = GameData.takeoutPrice(d);
    if (s.money < price) return false;
    s.money -= price;
    return true;
  }

  const map = { w: GameData.MAP[0].length, h: GameData.MAP.length, grid: GameData.MAP };
  function tileAt(col, row) {
    if (row < 0 || row >= map.h || col < 0 || col >= map.w) return '#';
    return map.grid[row][col];
  }
  function walkable(col, row, who) {
    const t = tileAt(col, row);
    if (t === '.') return true;
    if (t === 'K') return who === 'yu';
    if (t === 'O') return who === 'player';
    if (t === 'X') return who === 'player';
    if (t === 'T' || t === 'W') return who === 'player';
    if (t === 'D') return who === 'guest';
    return false;
  }

  function tables() {
    const out = [];
    const T = C.tile;
    function mk(cols, row) {
      out.push({
        id: out.length,
        cols: cols, row: row,
        x: (cols[0] + cols.length / 2) * T,
        y: (row + 0.5) * T,
        seats: cols.map(c => {
          const key = c + ',' + (row + 1);
          return {
            col: c, row: row + 1,
            x: (C.seatX && C.seatX[key] != null) ? C.seatX[key] : (c + 0.5) * T,
            y: (C.seatY && C.seatY[key] != null) ? C.seatY[key] : (row + 1.5) * T,
            guest: null
          };
        })
      });
    }
    for (let r = 0; r < map.h; r++) {
      let c = 0;
      while (c < map.w) {
        const t = tileAt(c, r);
        if (t === 'T') { mk([c], r); c++; }
        else if (t === 'W') {
          const cols = [];
          while (tileAt(c, r) === 'W') { cols.push(c); c++; }
          mk(cols, r);
        } else c++;
      }
    }
    return out;
  }

  function doorTile() {
    for (let r = 0; r < map.h; r++) for (let c = 0; c < map.w; c++) {
      if (tileAt(c, r) === 'D') return { col: c, row: r, x: (c + 0.5) * C.tile, y: (r + 0.5) * C.tile };
    }
    return { col: 1, row: 1, x: 60, y: 60 };
  }
  function findTile(ch) {
    for (let r = 0; r < map.h; r++) for (let c = 0; c < map.w; c++) {
      if (tileAt(c, r) === ch) return { col: c, row: r, x: (c + 0.5) * C.tile, y: (r + 0.5) * C.tile };
    }
    return null;
  }
  function counterRow() {
    for (let r = 0; r < map.h; r++) if (map.grid[r].indexOf('C') >= 0) return r;
    return 3;
  }
  function counterSpan() {
    const row = map.grid[counterRow()];
    return { start: row.indexOf('C'), end: row.lastIndexOf('C') };
  }
  function kitchenCenter() {
    let min = map.w, max = -1;
    for (let r = 0; r < map.h; r++) for (let c = 0; c < map.w; c++) {
      if (tileAt(c, r) === 'K') { if (c < min) min = c; if (c > max) max = c; }
    }
    if (max < 0) return map.w * C.tile / 2;
    return (min + (max - min + 1) / 2) * C.tile;
  }

  function approachColumn(seatCol, seatRow, corridorRow) {
    const cands = [];
    for (let d = 0; d < map.w; d++) { cands.push(seatCol - d); cands.push(seatCol + d); }
    for (const c of cands) {
      if (c < 1 || c >= map.w - 1) continue;
      let ok = true;
      const lo = Math.min(seatRow, corridorRow), hi = Math.max(seatRow, corridorRow);
      for (let r = lo; r <= hi && ok; r++) if (!walkable(c, r, 'guest')) ok = false;
      const a = Math.min(c, seatCol), b = Math.max(c, seatCol);
      for (let x = a; x <= b && ok; x++) if (!walkable(x, seatRow, 'guest')) ok = false;
      if (ok) return c;
    }
    return seatCol;
  }

  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const j = JSON.parse(raw);
      Object.assign(s, j);
      ['stock', 'guests', 'flags', 'cooked', 'stapleUsed'].forEach(k => { if (!s[k]) s[k] = {}; });
      ['unlocked', 'spoiled', 'newDishes', 'history', 'menu'].forEach(k => { if (!s[k]) s[k] = []; });

      s.menu = s.menu.filter(id => !!GameData.dish(id));
      s.unlocked = s.unlocked.filter(id => !!GameData.dish(id));
      if (typeof s.specialPity !== 'boolean') s.specialPity = false;
      const free = GameData.SLOTS.filter(e => !e.price).length;
      if (typeof s.slots !== 'number') s.slots = free;
      s.slots = Math.max(free, Math.min(GameData.SLOTS.length, s.slots));
      if (!s.stapleUsed) s.stapleUsed = {};
      return true;
    } catch (e) { return false; }
  }
  function clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  return {
    s, reset, save, load, clear,
    affLevel, cookSpeed, menuSlots, nextSlot, buySlot, addAffection,
    isUnlocked, unlockedDishes, masteryProgress, recordCooked, grantDish,
    count, hasIngredients, consumeIngredients, buy, sellPrice, spoil, expiringToday, orderTakeout,
    availableAttrs, stapleBill, clearStaples,
    map, tileAt, walkable, tables, doorTile, findTile, counterRow, counterSpan, kitchenCenter, approachColumn
  };
})();
